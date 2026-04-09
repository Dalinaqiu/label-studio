from organizations.models import OrganizationMember


class UserMixin:
    @property
    def is_annotator(self):
        membership = getattr(self, 'active_organization', None)
        if not membership:
            return False
        current_membership = self.om_through.filter(
            organization=self.active_organization,
            deleted_at__isnull=True,
        ).first()
        return bool(current_membership and current_membership.role == OrganizationMember.Role.ANNOTATOR)

    def is_project_annotator(self, project):
        return self.has_project_role(project, OrganizationMember.Role.ANNOTATOR)

    def get_active_organization_membership(self):
        if not getattr(self, 'active_organization', None):
            return None
        return self.om_through.filter(
            organization=self.active_organization,
            deleted_at__isnull=True,
        ).first()

    def has_manageable_organization_role(self):
        membership = self.get_active_organization_membership()
        return bool(membership and membership.role in OrganizationMember.MANAGEABLE_ROLES)

    def has_project_role(self, project, *roles):
        from projects.models import ProjectMemberRole

        if not project or project.organization_id != getattr(self, 'active_organization_id', None):
            return False
        if self.has_manageable_organization_role():
            return True
        return ProjectMemberRole.objects.filter(
            project_member__project=project,
            project_member__user=self,
            project_member__enabled=True,
            role__in=roles,
        ).exists()

    def is_project_member(self, project):
        if not project or project.organization_id != getattr(self, 'active_organization_id', None):
            return False
        if self.has_manageable_organization_role():
            return True
        return self.project_memberships.filter(project=project, enabled=True).exists()

    def has_permission(self, user):
        return OrganizationMember.objects.filter(
            user=user, organization=user.active_organization, deleted_at__isnull=True
        ).exists()
