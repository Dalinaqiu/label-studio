from django.db import migrations, models


def set_member_roles(apps, schema_editor):
    Organization = apps.get_model('organizations', 'Organization')
    OrganizationMember = apps.get_model('organizations', 'OrganizationMember')

    OrganizationMember.objects.filter(role='').update(role='AN')
    OrganizationMember.objects.filter(deleted_at__isnull=False).update(role='DI')

    for organization in Organization.objects.exclude(created_by_id=None):
        OrganizationMember.objects.filter(
            organization_id=organization.id,
            user_id=organization.created_by_id,
        ).update(role='OW')


class Migration(migrations.Migration):
    dependencies = [
        ('organizations', '0006_alter_organizationmember_deleted_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='organizationmember',
            name='role',
            field=models.CharField(
                choices=[
                    ('OW', 'Owner'),
                    ('AD', 'Administrator'),
                    ('MA', 'Manager'),
                    ('RE', 'Reviewer'),
                    ('AN', 'Annotator'),
                    ('VI', 'Viewer'),
                    ('NO', 'Pending'),
                    ('DI', 'Deactivated'),
                ],
                default='AN',
                help_text='Organization membership role',
                max_length=2,
                verbose_name='role',
            ),
        ),
        migrations.RunPython(set_member_roles, migrations.RunPython.noop),
    ]
