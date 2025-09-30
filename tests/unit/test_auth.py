import pytest
from unittest.mock import patch, MagicMock
from frontend.src.services.authService import authService

class TestAuthService:
    def setup_method(self):
        # Clear localStorage mock before each test
        authService.logout()

    def test_initial_state(self):
        assert not authService.isAuthenticated()
        assert authService.getToken() is None

    def test_login_success(self):
        mockResponse = {
            'access_token': 'fake-jwt-token',
            'token_type': 'bearer',
            'user': {'id': 1, 'username': 'testuser', 'email': 'test@example.com'}
        }

        with patch('axios.post') as mock_post:
            mock_post.return_value = MagicMock(data=mockResponse)

            result = authService.login({
                'username': 'testuser',
                'password': 'password123'
            })

            assert result == mockResponse
            assert authService.isAuthenticated()
            assert authService.getToken() == 'fake-jwt-token'

    def test_login_failure(self):
        with patch('axios.post') as mock_post:
            mock_post.side_effect = Exception('Login failed')

            with pytest.raises(Exception, match='Login failed'):
                authService.login({
                    'username': 'testuser',
                    'password': 'wrongpassword'
                })

            assert not authService.isAuthenticated()

    def test_logout(self):
        # Set up authenticated state
        authService.setToken('fake-token')

        assert authService.isAuthenticated()

        authService.logout()

        assert not authService.isAuthenticated()
        assert authService.getToken() is None

if __name__ == "__main__":
    pytest.main([__file__])
