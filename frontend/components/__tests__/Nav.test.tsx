import { render, screen } from '@testing-library/react';
import { Nav } from '@/components/Nav';

jest.mock('next/navigation', () => ({ usePathname: () => '/' }));

describe('Nav', () => {
  it('renders main links', () => {
    render(<Nav />);
    expect(screen.getByText('仪表盘')).toBeInTheDocument();
    expect(screen.getByText('知识库')).toBeInTheDocument();
    expect(screen.getByText('搜索')).toBeInTheDocument();
  });
});


