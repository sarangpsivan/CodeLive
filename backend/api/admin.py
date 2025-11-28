from django.contrib import admin
from .models import Project, Membership, ChatMessage, Folder, File, Documentation, Alert

admin.site.register(Project)
admin.site.register(Membership)
admin.site.register(ChatMessage)
admin.site.register(Folder)
admin.site.register(File)
admin.site.register(Documentation)
admin.site.register(Alert)