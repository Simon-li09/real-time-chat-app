from django.urls import path
from .views import (
    UserListView, UserSearchView, FollowUserView, 
    FollowedUsersListView, StatusListCreateView,
    SettingsUpdateView, LogoutView
)

urlpatterns = [
    path('', UserListView.as_view(), name='user-list'),
    path('search/', UserSearchView.as_view(), name='user-search'),
    path('follow/', FollowUserView.as_view(), name='user-follow'),
    path('followed/', FollowedUsersListView.as_view(), name='user-followed'),
    path('statuses/', StatusListCreateView.as_view(), name='status-list'),
    path('settings/', SettingsUpdateView.as_view(), name='settings-update'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
