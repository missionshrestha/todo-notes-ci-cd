from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .health import HealthView

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", include("notes.urls")),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/health/", HealthView.as_view(), name="health"),
]
