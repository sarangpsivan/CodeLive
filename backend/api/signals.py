from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import File, Folder, Documentation

@receiver(post_save, sender=File)
@receiver(post_delete, sender=File)
@receiver(post_save, sender=Folder)
@receiver(post_delete, sender=Folder)
@receiver(post_save, sender=Documentation)
@receiver(post_delete, sender=Documentation)
def update_project_timestamp(sender, instance, **kwargs):
    if instance.project:
        # Saving the project updates its 'updated_at' field because of auto_now=True
        instance.project.save()
