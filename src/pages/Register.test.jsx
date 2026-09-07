import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Register from './Register';
import { register } from '../api/auth';

vi.mock('../api/auth', () => ({
  register: vi.fn(),
}));

const renderRegister = () => {
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );
};

const fillAndSubmit = async (user, overrides = {}) => {
  const values = {
    fullName: 'Test Kullanıcı',
    email: 'test@example.com',
    password: 'sifre123',
    ...overrides,
  };
  if (values.fullName !== null) {
    await user.type(screen.getByLabelText('Ad Soyad'), values.fullName);
  }
  if (values.email !== null) {
    await user.type(screen.getByLabelText('E-posta'), values.email);
  }
  if (values.password !== null) {
    await user.type(screen.getByLabelText('Şifre'), values.password);
  }
  await user.click(screen.getByRole('button', { name: 'Kayıt Ol' }));
};

describe('Register sayfası', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ad soyad, e-posta, şifre alanlarını ve kayıt butonunu gösterir', () => {
    renderRegister();
    expect(screen.getByText('Kayıt Ol', { selector: 'h1' })).toBeInTheDocument();
    expect(screen.getByLabelText('Ad Soyad')).toBeInTheDocument();
    expect(screen.getByLabelText('E-posta')).toBeInTheDocument();
    expect(screen.getByLabelText('Şifre')).toBeInTheDocument();
  });

  it('gerekli alanlar boşken formu göndermeye çalışınca register çağrılmaz', async () => {
    renderRegister();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Kayıt Ol' }));
    expect(register).not.toHaveBeenCalled();
  });

  it('geçerli bilgilerle gönderilince register fonksiyonu doğru parametrelerle çağrılır', async () => {
    register.mockResolvedValueOnce({ data: {} });
    renderRegister();
    const user = userEvent.setup();

    await fillAndSubmit(user);

    expect(register).toHaveBeenCalledWith({
      fullName: 'Test Kullanıcı',
      email: 'test@example.com',
      password: 'sifre123',
    });
  });

  it('kayıt başarılı olunca başarı ekranını gösterir ve formu gizler', async () => {
    register.mockResolvedValueOnce({ data: {} });
    renderRegister();
    const user = userEvent.setup();

    await fillAndSubmit(user);

    expect(await screen.findByText('Kayıt başarılı!')).toBeInTheDocument();
    expect(screen.getByText('Giriş sayfasına dön')).toBeInTheDocument();
    expect(screen.queryByLabelText('Ad Soyad')).not.toBeInTheDocument();
  });

  it('register başarısız olunca sunucudan gelen hata mesajını gösterir', async () => {
    register.mockRejectedValueOnce({
      response: { data: { message: 'Bu e-posta zaten kayıtlı.' } },
    });
    renderRegister();
    const user = userEvent.setup();

    await fillAndSubmit(user);

    expect(await screen.findByText('Bu e-posta zaten kayıtlı.')).toBeInTheDocument();
    // Hata durumunda form hâlâ görünür olmalı (başarı ekranına geçilmemeli)
    expect(screen.getByLabelText('Ad Soyad')).toBeInTheDocument();
  });

  it('sunucudan mesaj gelmezse genel hata mesajını gösterir', async () => {
    register.mockRejectedValueOnce(new Error('network error'));
    renderRegister();
    const user = userEvent.setup();

    await fillAndSubmit(user);

    expect(
      await screen.findByText('Kayıt başarısız, bilgileri kontrol et.')
    ).toBeInTheDocument();
  });

  it('istek sürerken buton "Kayıt olunuyor..." metnini gösterir ve devre dışı kalır', async () => {
    let resolvePromise;
    register.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );
    renderRegister();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Ad Soyad'), 'Test Kullanıcı');
    await user.type(screen.getByLabelText('E-posta'), 'test@example.com');
    await user.type(screen.getByLabelText('Şifre'), 'sifre123');
    await user.click(screen.getByRole('button', { name: 'Kayıt Ol' }));

    const loadingButton = await screen.findByRole('button', { name: 'Kayıt olunuyor...' });
    expect(loadingButton).toBeDisabled();

    resolvePromise({ data: {} });
    expect(await screen.findByText('Kayıt başarılı!')).toBeInTheDocument();
  });

  it('"Giriş Yap" linki /login sayfasına yönlendirir', () => {
    renderRegister();
    const link = screen.getByRole('link', { name: 'Giriş Yap' });
    expect(link).toHaveAttribute('href', '/login');
  });
});
