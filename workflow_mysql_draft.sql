-- Compatible MySQL draft for project-level RBAC + annotation/review/final-review workflow
-- Targeted at the current Label Studio OSS schema in this repository.
--
-- Design goals:
-- 1. Reuse existing core tables: organization, organizationmember, project, projectmember, task, task_completion
-- 2. Avoid breaking current OSS semantics for Task / Annotation / FSM
-- 3. Add a business workflow layer for:
--    annotator -> reviewer -> admin(final review)
-- 4. Keep data migration burden low and make future Django migration implementation straightforward


-- =========================================================
-- A. Project-level roles
-- =========================================================
-- Existing projectmember only stores enabled flag.
-- Add a role binding table instead of forcing one role onto projectmember.
-- This supports a user holding multiple project-scoped roles in one project.

CREATE TABLE IF NOT EXISTS project_member_role (
    id BIGINT NOT NULL AUTO_INCREMENT,
    project_member_id INT NOT NULL,
    role CHAR(2) NOT NULL COMMENT 'OW,AD,MA,RE,AN,VI',
    granted_by_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_project_member_role (project_member_id, role),
    KEY idx_pmr_role (role),
    KEY idx_pmr_granted_by (granted_by_id),
    CONSTRAINT fk_pmr_project_member
        FOREIGN KEY (project_member_id) REFERENCES projectmember(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_pmr_granted_by
        FOREIGN KEY (granted_by_id) REFERENCES htx_user(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Project-scoped role bindings on top of projectmember';


-- =========================================================
-- B. Project workflow config
-- =========================================================
-- Keep project general-purpose and add explicit workflow switches.

ALTER TABLE project
    ADD COLUMN IF NOT EXISTS workflow_enabled TINYINT(1) NOT NULL DEFAULT 0
        COMMENT 'Whether project uses explicit annotator-reviewer-admin workflow',
    ADD COLUMN IF NOT EXISTS workflow_mode VARCHAR(32) NOT NULL DEFAULT 'STANDARD'
        COMMENT 'STANDARD, SIMPLE_REVIEW, CUSTOM_FUTURE',
    ADD COLUMN IF NOT EXISTS enable_review_stage TINYINT(1) NOT NULL DEFAULT 1
        COMMENT 'Whether reviewer step is enabled',
    ADD COLUMN IF NOT EXISTS enable_final_review_stage TINYINT(1) NOT NULL DEFAULT 1
        COMMENT 'Whether admin final review step is enabled',
    ADD COLUMN IF NOT EXISTS reviewer_can_edit TINYINT(1) NOT NULL DEFAULT 1
        COMMENT 'Whether reviewer can modify annotation result directly',
    ADD COLUMN IF NOT EXISTS admin_can_edit TINYINT(1) NOT NULL DEFAULT 1
        COMMENT 'Whether admin can modify final result directly',
    ADD COLUMN IF NOT EXISTS allow_final_reject_to_annotator TINYINT(1) NOT NULL DEFAULT 1
        COMMENT 'Whether final reviewer can reject directly back to annotator',
    ADD COLUMN IF NOT EXISTS allow_reopen_completed_task TINYINT(1) NOT NULL DEFAULT 1
        COMMENT 'Whether completed tasks can be reopened',
    ADD COLUMN IF NOT EXISTS task_assignment_mode VARCHAR(32) NOT NULL DEFAULT 'MANUAL'
        COMMENT 'MANUAL, HYBRID, AUTO_FUTURE';


-- =========================================================
-- C. Task workflow fields
-- =========================================================
-- Keep task.is_labeled and FSM states untouched.
-- Add business workflow state for the new review chain.

ALTER TABLE task
    ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(32) NOT NULL DEFAULT 'UNASSIGNED'
        COMMENT 'UNASSIGNED,PENDING_ANNOTATION,ANNOTATING,PENDING_REVIEW,REVIEWING,REVIEW_REJECTED,PENDING_FINAL_REVIEW,FINAL_REVIEWING,FINAL_REJECTED,COMPLETED,REOPENED',
    ADD COLUMN IF NOT EXISTS current_annotator_id INT NULL
        COMMENT 'Currently assigned annotator',
    ADD COLUMN IF NOT EXISTS current_reviewer_id INT NULL
        COMMENT 'Currently assigned reviewer',
    ADD COLUMN IF NOT EXISTS current_final_reviewer_id INT NULL
        COMMENT 'Currently assigned admin/final reviewer',
    ADD COLUMN IF NOT EXISTS current_annotation_id INT NULL
        COMMENT 'Current active annotation version for workflow',
    ADD COLUMN IF NOT EXISTS annotation_submitted_at DATETIME NULL,
    ADD COLUMN IF NOT EXISTS review_submitted_at DATETIME NULL,
    ADD COLUMN IF NOT EXISTS final_reviewed_at DATETIME NULL,
    ADD COLUMN IF NOT EXISTS workflow_completed_at DATETIME NULL,
    ADD COLUMN IF NOT EXISTS review_round INT NOT NULL DEFAULT 0
        COMMENT 'Incremented when re-entering review loop',
    ADD COLUMN IF NOT EXISTS reject_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reopen_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_workflow_locked TINYINT(1) NOT NULL DEFAULT 0
        COMMENT 'Business lock after final completion',
    ADD COLUMN IF NOT EXISTS assigned_at DATETIME NULL;

ALTER TABLE task
    ADD KEY IF NOT EXISTS idx_task_workflow_status (workflow_status),
    ADD KEY IF NOT EXISTS idx_task_current_annotator (current_annotator_id, workflow_status),
    ADD KEY IF NOT EXISTS idx_task_current_reviewer (current_reviewer_id, workflow_status),
    ADD KEY IF NOT EXISTS idx_task_current_final_reviewer (current_final_reviewer_id, workflow_status),
    ADD KEY IF NOT EXISTS idx_task_current_annotation (current_annotation_id),
    ADD CONSTRAINT fk_task_current_annotator
        FOREIGN KEY (current_annotator_id) REFERENCES htx_user(id)
        ON DELETE SET NULL,
    ADD CONSTRAINT fk_task_current_reviewer
        FOREIGN KEY (current_reviewer_id) REFERENCES htx_user(id)
        ON DELETE SET NULL,
    ADD CONSTRAINT fk_task_current_final_reviewer
        FOREIGN KEY (current_final_reviewer_id) REFERENCES htx_user(id)
        ON DELETE SET NULL,
    ADD CONSTRAINT fk_task_current_annotation
        FOREIGN KEY (current_annotation_id) REFERENCES task_completion(id)
        ON DELETE SET NULL;


-- =========================================================
-- D. Assignment history
-- =========================================================
-- Current assignees are denormalized on task; history lives here.

CREATE TABLE IF NOT EXISTS task_assignment (
    id BIGINT NOT NULL AUTO_INCREMENT,
    task_id INT NOT NULL,
    assignment_type VARCHAR(32) NOT NULL COMMENT 'ANNOTATOR,REVIEWER,FINAL_REVIEWER',
    user_id INT NOT NULL,
    assigned_by_id INT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    reason VARCHAR(255) NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    unassigned_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_ta_task_type_active (task_id, assignment_type, is_active),
    KEY idx_ta_user_type_active (user_id, assignment_type, is_active),
    KEY idx_ta_assigned_by (assigned_by_id),
    CONSTRAINT fk_ta_task
        FOREIGN KEY (task_id) REFERENCES task(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_ta_user
        FOREIGN KEY (user_id) REFERENCES htx_user(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_ta_assigned_by
        FOREIGN KEY (assigned_by_id) REFERENCES htx_user(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Task assignment and reassignment history';


-- =========================================================
-- E. Annotation workflow metadata
-- =========================================================
-- Reuse task_completion as the result/version table.
-- Add workflow metadata instead of introducing a second result table.

ALTER TABLE task_completion
    ADD COLUMN IF NOT EXISTS workflow_node VARCHAR(32) NOT NULL DEFAULT 'ANNOTATION'
        COMMENT 'ANNOTATION,REVIEW,FINAL',
    ADD COLUMN IF NOT EXISTS annotation_role CHAR(2) NULL
        COMMENT 'Role of the actor who produced this version: AN,RE,AD,OW',
    ADD COLUMN IF NOT EXISTS source_annotation_id INT NULL
        COMMENT 'Source annotation version from which this one derives',
    ADD COLUMN IF NOT EXISTS review_decision VARCHAR(32) NOT NULL DEFAULT 'PENDING'
        COMMENT 'PENDING,ACCEPTED,REJECTED',
    ADD COLUMN IF NOT EXISTS final_decision VARCHAR(32) NOT NULL DEFAULT 'PENDING'
        COMMENT 'PENDING,ACCEPTED,REJECTED',
    ADD COLUMN IF NOT EXISTS is_current_version TINYINT(1) NOT NULL DEFAULT 1
        COMMENT 'Marks the latest active annotation version for the task workflow';

ALTER TABLE task_completion
    ADD KEY IF NOT EXISTS idx_tc_workflow_node (workflow_node),
    ADD KEY IF NOT EXISTS idx_tc_task_current_version (task_id, is_current_version),
    ADD KEY IF NOT EXISTS idx_tc_source_annotation (source_annotation_id),
    ADD CONSTRAINT fk_tc_source_annotation
        FOREIGN KEY (source_annotation_id) REFERENCES task_completion(id)
        ON DELETE SET NULL;


-- =========================================================
-- F. Review records
-- =========================================================
-- One table for both reviewer review and admin final review.

CREATE TABLE IF NOT EXISTS task_review (
    id BIGINT NOT NULL AUTO_INCREMENT,
    task_id INT NOT NULL,
    annotation_id INT NOT NULL COMMENT 'Annotation version being reviewed',
    reviewed_annotation_id INT NULL COMMENT 'New annotation version produced during review edit',
    review_type VARCHAR(32) NOT NULL COMMENT 'REVIEW,FINAL_REVIEW',
    decision VARCHAR(32) NOT NULL COMMENT 'APPROVED,REJECTED,FIXED_AND_APPROVED,RETURNED,REOPENED',
    reviewer_id INT NOT NULL,
    review_round INT NOT NULL DEFAULT 0,
    comment TEXT NULL,
    extra JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_tr_task_type_round (task_id, review_type, review_round),
    KEY idx_tr_reviewer_type (reviewer_id, review_type),
    KEY idx_tr_annotation (annotation_id),
    KEY idx_tr_reviewed_annotation (reviewed_annotation_id),
    CONSTRAINT fk_tr_task
        FOREIGN KEY (task_id) REFERENCES task(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tr_annotation
        FOREIGN KEY (annotation_id) REFERENCES task_completion(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tr_reviewed_annotation
        FOREIGN KEY (reviewed_annotation_id) REFERENCES task_completion(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_tr_reviewer
        FOREIGN KEY (reviewer_id) REFERENCES htx_user(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Review and final-review records';


-- =========================================================
-- G. Reject / return history
-- =========================================================
-- Keep reject reasons normalized and queryable for reporting.

CREATE TABLE IF NOT EXISTS task_review_reject_log (
    id BIGINT NOT NULL AUTO_INCREMENT,
    task_id INT NOT NULL,
    task_review_id BIGINT NULL,
    from_stage VARCHAR(32) NOT NULL COMMENT 'ANNOTATION,REVIEW,FINAL',
    to_stage VARCHAR(32) NOT NULL COMMENT 'ANNOTATION,REVIEW',
    operator_id INT NOT NULL,
    reason TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_trrl_task (task_id),
    KEY idx_trrl_review (task_review_id),
    KEY idx_trrl_operator (operator_id),
    CONSTRAINT fk_trrl_task
        FOREIGN KEY (task_id) REFERENCES task(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_trrl_task_review
        FOREIGN KEY (task_review_id) REFERENCES task_review(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_trrl_operator
        FOREIGN KEY (operator_id) REFERENCES htx_user(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Explicit reject/return records with reasons';


-- =========================================================
-- H. Workflow event log
-- =========================================================
-- Business-level audit log, separate from generic FSM history.

CREATE TABLE IF NOT EXISTS task_workflow_log (
    id BIGINT NOT NULL AUTO_INCREMENT,
    task_id INT NOT NULL,
    from_status VARCHAR(32) NULL,
    to_status VARCHAR(32) NOT NULL,
    action_type VARCHAR(64) NOT NULL
        COMMENT 'ASSIGN_ANNOTATOR,ASSIGN_REVIEWER,SUBMIT_ANNOTATION,REVIEW_PASS,REVIEW_REJECT,FINAL_PASS,FINAL_REJECT,REOPEN,UPDATE_RESULT',
    operator_id INT NOT NULL,
    operator_role CHAR(2) NULL,
    annotation_id INT NULL,
    task_review_id BIGINT NULL,
    payload JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_twl_task_created (task_id, created_at),
    KEY idx_twl_operator_created (operator_id, created_at),
    KEY idx_twl_task_review (task_review_id),
    CONSTRAINT fk_twl_task
        FOREIGN KEY (task_id) REFERENCES task(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_twl_operator
        FOREIGN KEY (operator_id) REFERENCES htx_user(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_twl_annotation
        FOREIGN KEY (annotation_id) REFERENCES task_completion(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_twl_task_review
        FOREIGN KEY (task_review_id) REFERENCES task_review(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Workflow-level event/audit log';


-- =========================================================
-- I. Optional bootstrap / data migration suggestions
-- =========================================================
-- 1. Existing project members can be initialized with ANNOTATOR role:
-- INSERT INTO project_member_role (project_member_id, role, granted_by_id, created_at, updated_at)
-- SELECT pm.id, 'AN', p.created_by_id, NOW(), NOW()
-- FROM projectmember pm
-- JOIN project p ON p.id = pm.project_id
-- LEFT JOIN project_member_role pmr ON pmr.project_member_id = pm.id AND pmr.role = 'AN'
-- WHERE pmr.id IS NULL;
--
-- 2. Existing tasks can be initialized:
-- UPDATE task
-- SET workflow_status = CASE
--     WHEN is_labeled = 1 THEN 'COMPLETED'
--     ELSE 'UNASSIGNED'
-- END
-- WHERE workflow_status IS NULL OR workflow_status = 'UNASSIGNED';
--
-- 3. Existing latest annotation can be marked current per task in a later migration script.


-- =========================================================
-- J. Implementation notes for the next Django round
-- =========================================================
-- 1. Do not replace existing Task FSM enums yet.
--    Introduce workflow_status as business state and migrate API logic gradually.
-- 2. Replace broad org-only filtering in TaskManager.for_user() with:
--    - org admin global access
--    - project role access
--    - task current assignee access
-- 3. Keep annotation draft behavior unchanged.
-- 4. Reviewer edits should create a new task_completion row rather than mutating old data in place.
-- 5. Final review pass should set:
--    task.workflow_status='COMPLETED'
--    task.is_workflow_locked=1
--    task.workflow_completed_at=NOW()
-- 6. Reopen should create a workflow log row and clear the business lock only.
