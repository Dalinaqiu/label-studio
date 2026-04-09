/**
 * Label Studio Open Source - State Registry
 *
 * This file registers core LSO project states with the state registry from app-common.
 *
 * The base registry (imported from @humansignal/app-common) provides:
 * - StateRegistry class and singleton instance
 * - StateType enum (INITIAL, IN_PROGRESS, ATTENTION, TERMINAL)
 * - Helper functions (getStateColorClass, formatStateName, etc.)
 *
 * LSO supports a simplified state model with 3 core project states:
 * - CREATED (initial state)
 * - ANNOTATION_IN_PROGRESS (work in progress)
 * - COMPLETED (terminal state)
 *
 * IMPORTANT: Import this file in your main.tsx or app initialization:
 * ```typescript
 * import './utils/state-registry-lso';
 * ```
 */

import { stateRegistry, StateType } from "@humansignal/app-common";

// ============================================================================
// Project States (LSO Core)
// ============================================================================

/**
 * LSO has a simplified state model with 3 core states.
 * LSE extends this with additional workflow states (review, arbitration, etc.)
 */
stateRegistry.registerBatch({
  CREATED: {
    type: StateType.INITIAL,
    label: "Created",
    tooltips: {
      project: "Project has been created and is ready for configuration",
    },
  },

  ANNOTATION_IN_PROGRESS: {
    type: StateType.IN_PROGRESS,
    label: "In Progress",
    tooltips: {
      project: "Annotation work is in progress on this project",
      task: "Task is being annotated",
    },
  },

  COMPLETED: {
    type: StateType.TERMINAL,
    label: "Completed",
    tooltips: {
      project: "All work on this project is completed",
      task: "Task has been completed",
    },
  },

  UNASSIGNED: {
    type: StateType.INITIAL,
    label: "Unassigned",
    tooltips: {
      task: "Task has not been assigned yet",
    },
  },

  PENDING_ANNOTATION: {
    type: StateType.IN_PROGRESS,
    label: "Pending Annotation",
    tooltips: {
      task: "Task is assigned and waiting for annotation",
    },
  },

  ANNOTATING: {
    type: StateType.IN_PROGRESS,
    label: "Annotating",
    tooltips: {
      task: "Task is currently being annotated",
    },
  },

  PENDING_REVIEW: {
    type: StateType.ATTENTION,
    label: "Pending Review",
    tooltips: {
      task: "Task is waiting for reviewer approval",
    },
  },

  REVIEWING: {
    type: StateType.ATTENTION,
    label: "Reviewing",
    tooltips: {
      task: "Task is being reviewed",
    },
  },

  REVIEW_REJECTED: {
    type: StateType.ATTENTION,
    label: "Review Rejected",
    tooltips: {
      task: "Task was rejected by reviewer and returned for changes",
    },
  },

  PENDING_FINAL_REVIEW: {
    type: StateType.ATTENTION,
    label: "Pending Final Review",
    tooltips: {
      task: "Task is waiting for final review",
    },
  },

  FINAL_REVIEWING: {
    type: StateType.ATTENTION,
    label: "Final Reviewing",
    tooltips: {
      task: "Task is being reviewed by final reviewer",
    },
  },

  FINAL_REJECTED: {
    type: StateType.ATTENTION,
    label: "Final Rejected",
    tooltips: {
      task: "Task was rejected during final review",
    },
  },

  REOPENED: {
    type: StateType.IN_PROGRESS,
    label: "Reopened",
    tooltips: {
      task: "Task was reopened and sent back into workflow",
    },
  },
});

// ============================================================================
// Development Validation
// ============================================================================

/**
 * In development mode, verify all expected LSO states are properly registered.
 * This helps catch configuration issues early.
 */
if (process.env.NODE_ENV === "development") {
  const lsoStates = [
    "CREATED",
    "ANNOTATION_IN_PROGRESS",
    "COMPLETED",
    "UNASSIGNED",
    "PENDING_ANNOTATION",
    "ANNOTATING",
    "PENDING_REVIEW",
    "REVIEWING",
    "REVIEW_REJECTED",
    "PENDING_FINAL_REVIEW",
    "FINAL_REVIEWING",
    "FINAL_REJECTED",
    "REOPENED",
  ];

  const missingStates = lsoStates.filter((state) => !stateRegistry.isRegistered(state));

  if (missingStates.length > 0) {
    console.error("[LSO State Registry] Missing state registrations:", missingStates);
  } else {
    console.log("[LSO State Registry] ✅ All LSO states registered successfully");
    console.log(`[LSO State Registry] Registered ${lsoStates.length} LSO states`);
  }

  // Log all registered states for debugging
  if (process.env.DEBUG_STATE_REGISTRY) {
    console.log("[LSO State Registry] All registered states:", stateRegistry.getAllStates());
  }
}
