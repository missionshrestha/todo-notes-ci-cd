from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", include("notes.urls")),
    # /api/health/ will be added in 1.4
    
]
