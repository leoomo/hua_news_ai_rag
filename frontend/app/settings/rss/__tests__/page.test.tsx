import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RssSettingsPage from '@/app/settings/rss/page';

const getMock = jest.fn().mockResolvedValue({ data: { data: [
  { id: 1, name: '新华社', url: 'https://www.xinhuanet.com/rss', category: 'china', is_active: true },
]} });
const postMock = jest.fn().mockResolvedValue({ data: { code: 0 }});
const patchMock = jest.fn().mockResolvedValue({ data: { code: 0 }});
const deleteMock = jest.fn().mockResolvedValue({ data: { code: 0 }});

jest.mock('@/lib/api', () => ({
  api: {
    get: (...args: any[]) => getMock(...args),
    post: (...args: any[]) => postMock(...args),
    patch: (...args: any[]) => patchMock(...args),
    delete: (...args: any[]) => deleteMock(...args),
  }
}));

describe('RSS Settings Page', () => {
  it('renders list and supports create/edit/delete', async () => {
    render(<RssSettingsPage />);

    // list rendered
    expect(await screen.findByText('新华社')).toBeInTheDocument();

    // create
    fireEvent.change(screen.getByPlaceholderText('名称'), { target: { value: 'BBC' }});
    fireEvent.change(screen.getByPlaceholderText('URL'), { target: { value: 'http://bbc.com/rss' }});
    fireEvent.click(screen.getByText('添加'));
    await waitFor(() => expect(postMock).toHaveBeenCalled());

    // edit start
    fireEvent.click(screen.getAllByText('编辑')[0]);
    const nameInputs = screen.getAllByDisplayValue('新华社');
    fireEvent.change(nameInputs[0], { target: { value: '新华社-更新' }});
    fireEvent.click(screen.getByText('保存'));
    await waitFor(() => expect(patchMock).toHaveBeenCalled());

    // delete
    fireEvent.click(screen.getAllByText('删除')[0]);
    await waitFor(() => expect(deleteMock).toHaveBeenCalled());
  });
});


