# Importing required libraries
from rest_framework import viewsets, permissions
from .models import Note
from .serializers import NoteSerializer 
class NoteViewSet(viewsets.ModelViewSet):
    """
    Simple CRUD for notes.
    Auth/permissions will be tightened in 1.3.
    """
    queryset = Note.objects.all().order_by("-updated_at")
    serializer_class = NoteSerializer
    permission_classes = [permissions.AllowAny]  
