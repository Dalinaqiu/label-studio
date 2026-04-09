from rest_framework.permissions import SAFE_METHODS, BasePermission


class HasObjectPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.has_permission(request.user)


class MemberHasOwnerPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method not in SAFE_METHODS:
            organization_id = getattr(obj, 'organization_id', None)

            if organization_id is None:
                organization_id = getattr(obj, 'pk', None)

            if organization_id is None or not request.user.is_organization_admin(organization_id):
                return False

        return obj.has_permission(request.user)
