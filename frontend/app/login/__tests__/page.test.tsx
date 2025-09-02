import { render, screen } from '@testing-library/react';
import LoginPage from '@/app/login/page';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: () => {} }) }));

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getAllByText('登录').length).toBeGreaterThanOrEqual(2);
  });
});


