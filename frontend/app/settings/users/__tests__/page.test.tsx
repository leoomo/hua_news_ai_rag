import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UsersSettingsPage from '@/app/settings/users/page';

const getMock = jest.fn().mockResolvedValue({ data: { data: [
  { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin' },
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

describe('Users Settings Page', () => {
  it('renders list and supports create/edit/delete', async () => {
    render(<UsersSettingsPage />);

    // list rendered
    expect(await screen.findByText('admin')).toBeInTheDocument();

    // create
    fireEvent.change(screen.getByPlaceholderText('用户名'), { target: { value: 'alice' }});
    fireEvent.change(screen.getByPlaceholderText('邮箱'), { target: { value: 'alice@example.com' }});
    fireEvent.click(screen.getByText('添加'));
    await waitFor(() => expect(postMock).toHaveBeenCalled());

    // edit
    fireEvent.click(screen.getAllByText('编辑')[0]);
    const usernameInputs = screen.getAllByDisplayValue('admin');
    fireEvent.change(usernameInputs[0], { target: { value: 'admin2' }});
    fireEvent.click(screen.getByText('保存'));
    await waitFor(() => expect(patchMock).toHaveBeenCalled());

    // delete
    fireEvent.click(screen.getAllByText('删除')[0]);
    await waitFor(() => expect(deleteMock).toHaveBeenCalled());
  });
});


