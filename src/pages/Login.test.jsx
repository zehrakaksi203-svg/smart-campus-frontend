import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import { login } from '../api/auth';

vi.mock('../api/auth', () => ({
  login: vi.fn(),
}));

const renderLogin = () => {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
};

describe('Login sayfası', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('e-posta, şifre alanlarını ve giriş butonunu gösterir', () => {
    renderLogin();
    expect(screen.getByText('Giriş Yap', { selector: 'h1' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-posta')).toBeInTheDocument();
    expect(screen.getByLabelText('Şifre')).toBeInTheDocument();
  });

  it('gerekli alanlar boşken formu göndermeye çalışınca login çağrılmaz', async () => {
    renderLogin();
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: 'Giriş Yap' });
    await user.click(button);
    expect(login).not.toHaveBeenCalled();
  });

  it('geçerli bilgilerle gönderilince login fonksiyonu doğru parametrelerle çağrılır', async () => {
    login.mockResolvedValueOnce({
      data: { accessToken: 'fake-token', refreshToken: 'fake-refresh' },
    });

    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('E-posta'), 'test@example.com');
    await user.type(screen.getByLabelText('Şifre'), 'sifre123');
    await user.click(screen.getByRole('button', { name: 'Giriş Yap' }));

    expect(login).toHaveBeenCalledWith('test@example.com', 'sifre123');
  });

  it('login başarısız olunca hata mesajı gösterir', async () => {
    login.mockRejectedValueOnce({
      response: { data: { message: 'Şifre yanlış.' } },
    });

    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('E-posta'), 'test@example.com');
    await user.type(screen.getByLabelText('Şifre'), 'yanlissifre');
    await user.click(screen.getByRole('button', { name: 'Giriş Yap' }));

    expect(await screen.findByText('Şifre yanlış.')).toBeInTheDocument();
  });
});