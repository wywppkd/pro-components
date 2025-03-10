import ProForm, { ProFormText } from '@ant-design/pro-form';
import type { ActionType, EditableFormInstance, ProColumns } from '@ant-design/pro-table';
import { EditableProTable } from '@ant-design/pro-table';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { InputNumber } from 'antd';
import React from 'react';
import { waitForComponentToPaint } from '../util';

type DataSourceType = {
  id: number | string;
  title?: string;
  labels?: {
    name: string;
    color: string;
  }[];
  state?: string;
  time?: {
    created_at?: string;
  };
  children?: DataSourceType[];
};

const defaultData: DataSourceType[] = [
  {
    id: 624748504,
    title: '🐛 [BUG]yarn install命令 antd2.4.5会报错',
    labels: [{ name: 'bug', color: 'error' }],
    time: {
      created_at: '2020-05-26T09:42:56Z',
    },
    state: 'processing',
  },
  {
    id: 624691229,
    title: '🐛 [BUG]无法创建工程npm create umi',
    labels: [{ name: 'bug', color: 'error' }],
    time: {
      created_at: '2020-05-26T08:19:22Z',
    },
    state: 'closed',
  },
  {
    id: 624674790,
    title: '🧐 [问题] build 后还存在 es6 的代码（Umi@2.13.13）',
    labels: [{ name: 'question', color: 'success' }],
    state: 'open',
    time: {
      created_at: '2020-05-26T07:54:25Z',
    },
    children: [
      {
        id: 6246747901,
        title: '嵌套数据的编辑',
        labels: [{ name: 'question', color: 'success' }],
        state: 'closed',
        time: {
          created_at: '2020-05-26T07:54:25Z',
        },
        children: [
          {
            id: 62467479012,
            title: '嵌套数据的编辑',
            labels: [{ name: 'question', color: 'success' }],
            state: 'closed',
            time: {
              created_at: '2020-05-26T07:54:25Z',
            },
          },
        ],
      },
    ],
  },
];

const columns: ProColumns<DataSourceType>[] = [
  {
    dataIndex: 'index',
    valueType: 'indexBorder',
    width: 48,
    renderFormItem: () => <InputNumber />,
  },
  {
    title: '标题',
    dataIndex: 'title',
    copyable: true,
    fieldProps: {
      onChange: () => null,
    },
    ellipsis: true,
    tip: '标题过长会自动收缩',
    formItemProps: {
      rules: [
        {
          required: true,
          message: '此项为必填项',
        },
      ],
    },
    width: '30%',
    search: false,
  },
  {
    title: '状态',
    dataIndex: 'state',
    initialValue: 'open',
    filters: true,
    valueType: 'select',
    width: 120,
    valueEnum: {
      all: { text: '全部', status: 'Default' },
      open: {
        text: '未解决',
        status: 'Error',
      },
      closed: {
        text: '已解决',
        status: 'Success',
      },
      processing: {
        text: '解决中',
        status: 'Processing',
      },
    },
  },
  {
    title: '创建时间',
    dataIndex: ['time', 'created_at'],
    valueType: 'date',
  },
  {
    title: '操作',
    valueType: 'option',
    render: (text, row, _, action) => [
      <a
        key="editor"
        id="editor"
        onClick={() => {
          action?.startEditable?.(row.id);
        }}
      >
        编辑
      </a>,
    ],
  },
];

describe('EditorProTable', () => {
  afterEach(() => {
    cleanup();
  });
  it('📝 EditableProTable support recordCreatorProps=false', async () => {
    const wrapper = render(
      <EditableProTable<DataSourceType>
        rowKey="id"
        recordCreatorProps={false}
        columns={columns}
        value={defaultData}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);
    expect(wrapper.asFragment()).toMatchSnapshot();
  });

  it('📝 EditableProTable support pagination', async () => {
    const fn = jest.fn();
    const wrapper = render(
      <EditableProTable<DataSourceType>
        rowKey="id"
        pagination={{
          pageSize: 2,
          current: 2,
        }}
        editable={{
          onChange: (keys) => fn(keys[0]),
        }}
        recordCreatorProps={{
          position: 'bottom',
          record: {
            id: 555,
          },
          id: 'addEditRecord',
        }}
        columns={columns}
        value={defaultData}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);

    await act(async () => {
      (await wrapper.queryByText('添加一行数据'))?.click();
    });

    await waitForComponentToPaint(wrapper, 1000);

    expect(fn).toBeCalledWith(555);

    wrapper.unmount();
  });

  it('📝 EditableProTable addEditRecord is null will throw Error', async () => {
    const spy = jest.spyOn(global.console, 'warn').mockImplementation();
    const actionRef = React.createRef<ActionType>();
    const wrapper = render(
      <EditableProTable<DataSourceType>
        rowKey="id"
        pagination={{
          pageSize: 2,
          current: 2,
        }}
        actionRef={actionRef}
        columns={columns}
        value={defaultData}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);

    try {
      actionRef.current?.addEditRecord(undefined);
    } catch (error: any) {
      expect(error.message).toEqual('请设置 recordCreatorProps.record 并返回一个唯一的key');
    }
    await waitForComponentToPaint(wrapper, 1000);
    spy.mockRestore();
    wrapper.unmount();
  });

  it('📝 EditableProTable add support children column', async () => {
    const onchange = jest.fn();
    const wrapper = render(
      <EditableProTable<DataSourceType>
        rowKey="id"
        pagination={{
          pageSize: 2,
          current: 2,
        }}
        editable={{}}
        onChange={(data) => onchange(data[0].children?.length)}
        recordCreatorProps={{
          position: 'bottom',
          newRecordType: 'dataSource',
          parentKey: () => 624674790,
          record: {
            id: 555,
          },
          id: 'addEditRecord',
        }}
        columns={columns}
        value={[
          {
            id: 624674790,
            title: '🧐 [问题] build 后还存在 es6 的代码（Umi@2.13.13）',
            labels: [{ name: 'question', color: 'success' }],
            state: 'open',
            time: {
              created_at: '2020-05-26T07:54:25Z',
            },
            children: [
              {
                id: 6246747901,
                title: '嵌套数据的编辑',
                labels: [{ name: 'question', color: 'success' }],
                state: 'closed',
                time: {
                  created_at: '2020-05-26T07:54:25Z',
                },
              },
            ],
          },
        ]}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);

    await act(async () => {
      (await wrapper.queryByText('添加一行数据'))?.click();
    });

    await waitForComponentToPaint(wrapper, 1000);

    expect(onchange).toBeCalledWith(2);

    wrapper.unmount();
  });

  it('📝 EditableProTable add support nested children column', async () => {
    const onchange = jest.fn();
    const wrapper = render(
      <EditableProTable<DataSourceType>
        rowKey="id"
        pagination={{
          pageSize: 2,
          current: 2,
        }}
        editable={{}}
        expandable={{
          childrenColumnName: 'children',
        }}
        onChange={(data) => {
          onchange(data[0].children![0]!.children!.length);
        }}
        recordCreatorProps={{
          position: 'top',
          newRecordType: 'dataSource',
          parentKey: () => 6246747901,
          record: {
            id: 555,
          },
          id: 'addEditRecord',
        }}
        columns={columns}
        value={[
          {
            id: 624674790,
            title: '🧐 [问题] build 后还存在 es6 的代码（Umi@2.13.13）',
            labels: [{ name: 'question', color: 'success' }],
            state: 'open',
            time: {
              created_at: '2020-05-26T07:54:25Z',
            },
            children: [
              {
                id: 6246747901,
                title: '嵌套数据的编辑',
                labels: [{ name: 'question', color: 'success' }],
                state: 'closed',
                time: {
                  created_at: '2020-05-26T07:54:25Z',
                },
              },
            ],
          },
        ]}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);

    await act(async () => {
      (await wrapper.queryAllByText('添加一行数据')).at(0)?.click();
    });

    await waitForComponentToPaint(wrapper, 1000);

    expect(onchange).toBeCalledWith(1);

    wrapper.unmount();
  });

  it("📝 EditableProTable can't find record by parentKey", async () => {
    const onchange = jest.fn();
    const wrapper = render(
      <EditableProTable<DataSourceType>
        rowKey="id"
        pagination={{
          pageSize: 2,
          current: 2,
        }}
        editable={{}}
        onChange={(data) => onchange(data[0].children?.length)}
        expandable={{
          childrenColumnName: 'children',
        }}
        recordCreatorProps={{
          position: 'bottom',
          newRecordType: 'dataSource',
          parentKey: () => 624671234,
          record: {
            id: 555,
          },
          id: 'addEditRecord',
        }}
        columns={columns}
        value={[
          {
            id: 624674790,
            title: '点击添加按钮，但是和我的parentKey不同，会报错的！',
            labels: [{ name: 'question', color: 'success' }],
            state: 'open',
            time: {
              created_at: '2020-05-26T07:54:25Z',
            },
            children: [
              {
                id: 6246747901,
                title: '嵌套数据的编辑',
                labels: [{ name: 'question', color: 'success' }],
                state: 'closed',
                time: {
                  created_at: '2020-05-26T07:54:25Z',
                },
              },
            ],
          },
        ]}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);

    await act(async () => {
      (await wrapper.queryByText('添加一行数据'))?.click();
    });

    await waitForComponentToPaint(wrapper, 1000);

    expect(onchange).not.toBeCalled();

    wrapper.unmount();
  });

  it('📝 EditableProTable add support parentKey when newRecordType = cache', async () => {
    const fn = jest.fn();
    const wrapper = render(
      <EditableProTable<DataSourceType>
        rowKey="id"
        recordCreatorProps={{
          newRecordType: 'cache',
          record: () => ({
            id: 555,
          }),
          parentKey: () => 624748504,
          id: 'add_new',
        }}
        columns={columns}
        defaultValue={defaultData}
        onChange={(list) => fn(list.length)}
        expandable={{
          defaultExpandAllRows: true,
        }}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);

    await act(async () => {
      (await wrapper.queryByText('添加一行数据'))?.click();
    });

    await waitForComponentToPaint(wrapper, 2000);

    expect(fn).not.toBeCalled();
    act(() => {
      fireEvent.change(
        wrapper.container
          .querySelectorAll('.ant-table-tbody tr.ant-table-row')[1]
          .querySelectorAll(`td .ant-input`)[0],
        {
          target: {
            value: 'zqran',
          },
        },
      );
    });

    await waitForComponentToPaint(wrapper, 1000);

    expect(
      wrapper.container
        .querySelectorAll('.ant-table-tbody tr.ant-table-row')[1]
        .querySelectorAll('input'),
    ).toBeTruthy();
    expect(
      wrapper.container.querySelector('.ant-table-tbody')?.querySelectorAll('tr.ant-table-row')
        .length,
    ).toBe(6);

    act(() => {
      wrapper.container
        .querySelectorAll('.ant-table-tbody tr.ant-table-row')[1]
        .querySelectorAll<HTMLAnchorElement>(`td a`)[0]
        ?.click?.();
    });

    await waitForComponentToPaint(wrapper, 1000);

    expect(wrapper.container.querySelectorAll('.ant-table-row.ant-table-row-level-1').length).toBe(
      2,
    );

    wrapper.unmount();
  });

  it('📝 EditableProTable support maxLength', async () => {
    const wrapper = render(
      <EditableProTable<DataSourceType>
        maxLength={2}
        rowKey="id"
        columns={columns}
        value={defaultData}
      />,
    );
    await waitForComponentToPaint(wrapper, 100);
    expect(wrapper.container.querySelectorAll('button.ant-btn-dashed').length).toBe(0);

    act(() => {
      wrapper.rerender(
        <EditableProTable<DataSourceType>
          maxLength={20}
          rowKey="id"
          columns={columns}
          value={defaultData}
        />,
      );
    });

    await waitForComponentToPaint(wrapper, 100);

    expect(wrapper.container.querySelectorAll('button.ant-btn-dashed').length).toBe(1);
  });

  it('📝 EditableProTable support editableFormRef', async () => {
    const editorRef = React.createRef<EditableFormInstance<DataSourceType>>();
    const wrapper = render(
      <EditableProTable<DataSourceType>
        editableFormRef={editorRef}
        rowKey="id"
        columns={columns}
        value={defaultData}
        editable={{
          editableKeys: defaultData.map((item) => item.id),
        }}
      />,
    );
    await waitForComponentToPaint(wrapper, 100);

    const firstRowKey = defaultData[0]?.id || 0;

    expect(editorRef.current?.getRowData?.(firstRowKey)?.title).toBe(defaultData?.[0]?.title);

    expect(editorRef.current?.getRowData?.(0)?.title).toBe(defaultData?.[0]?.title);

    await waitForComponentToPaint(wrapper, 100);

    act(() => {
      editorRef.current?.setRowData?.(firstRowKey, { title: 'test-title' });
    });

    expect(editorRef.current?.getRowData?.(firstRowKey)?.title).toBe('test-title');

    expect(editorRef.current?.getRowsData?.()?.length).toBe(3);

    wrapper.unmount();
  });

  it('📝 EditableProTable editableFormRef need rowIndex', async () => {
    const editorRef = React.createRef<EditableFormInstance<DataSourceType>>();
    const wrapper = render(
      <EditableProTable<DataSourceType>
        editableFormRef={editorRef}
        rowKey="id"
        columns={columns}
        value={defaultData}
        editable={{
          editableKeys: defaultData.map((item) => item.id),
        }}
      />,
    );
    await waitForComponentToPaint(wrapper, 100);

    try {
      //@ts-expect-error
      editorRef.current?.getRowData?.();
    } catch (error) {
      // @ts-ignore
      expect(error.message).toBe('rowIndex is required');
    }

    try {
      //@ts-expect-error
      editorRef.current?.setRowData?.(undefined, { title: 'test-title' });
    } catch (error) {
      // @ts-ignore
      expect(error.message).toBe('rowIndex is required');
    }

    wrapper.unmount();
  });

  it('📝 EditableProTable use name support editableFormRef', async () => {
    const editorRef = React.createRef<EditableFormInstance<DataSourceType>>();
    const wrapper = render(
      <ProForm
        initialValues={{
          table: defaultData,
        }}
      >
        <EditableProTable<DataSourceType>
          editableFormRef={editorRef}
          rowKey="id"
          name="table"
          columns={columns}
        />
        <ProFormText name="test" />
      </ProForm>,
    );

    const firstRowKey = defaultData?.[0]?.id || 0;

    expect(editorRef.current?.getRowData?.(firstRowKey)?.title).toBe(defaultData?.[0]?.title);

    expect(editorRef.current?.getRowData?.(0)?.title).toBe(defaultData?.[0]?.title);

    act(() => {
      editorRef.current?.setRowData?.(firstRowKey, { title: 'test-title' });
    });

    expect(editorRef.current?.getRowData?.(firstRowKey)?.title).toBe('test-title');

    expect(editorRef.current?.getRowsData?.()?.length).toBe(3);

    wrapper.unmount();
  });

  it('📝 EditableProTable add newLine use rowKey', async () => {
    const fn = jest.fn();
    const wrapper = render(
      <ProForm
        initialValues={{
          table: defaultData,
        }}
      >
        <EditableProTable<DataSourceType>
          recordCreatorProps={{
            id: 'new-button',
            record: () => ({ id: '1234' }),
          }}
          editable={{
            onChange: (keys) => {
              fn(keys.join(','));
            },
          }}
          rowKey="id"
          name="table"
          columns={columns}
        />
      </ProForm>,
    );

    await act(async () => {
      (await wrapper.queryByText('添加一行数据'))?.click();
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(fn).toBeCalledWith('1234');
  });

  it('📝 EditableProTable add newLine when position=top', async () => {
    const wrapper = render(
      <ProForm
        initialValues={{
          table: defaultData,
        }}
      >
        <EditableProTable<DataSourceType>
          recordCreatorProps={{
            id: 'new-button',
            record: () => ({ id: Math.random() * 100000000 }),
            position: 'top',
          }}
          rowKey="id"
          name="table"
          columns={columns}
        />
      </ProForm>,
    );

    await act(async () => {
      (await wrapper.queryAllByText('添加一行数据')).at(0)?.click();
    });

    await act(async () => {
      (await wrapper.queryAllByText('添加一行数据')).at(0)?.click();
    });
    await waitForComponentToPaint(wrapper, 200);

    const firstLineValue = wrapper.container
      .querySelectorAll('.ant-table-tbody tr.ant-table-row')[0]
      .querySelectorAll<HTMLInputElement>(`td .ant-input`)[0].value;

    expect(firstLineValue).toBe('');

    wrapper.unmount();
  });

  it('📝 EditableProTable support actionRender', async () => {
    const wrapper = render(
      <EditableProTable<DataSourceType>
        rowKey="id"
        recordCreatorProps={false}
        columns={columns}
        request={async () => ({
          data: defaultData,
          total: 3,
          success: true,
        })}
        editable={{
          editableKeys: [624748504],
          actionRender: () => [
            <div key="test" id="test">
              xx
            </div>,
          ],
        }}
        value={defaultData}
      />,
    );
    await waitForComponentToPaint(wrapper, 1100);
    expect(wrapper.container.querySelector('div#test')?.textContent).toBe('xx');
  });

  it('📝 EditableProTable support recordCreatorProps', async () => {
    const wrapper = render(
      <EditableProTable<DataSourceType>
        rowKey="id"
        recordCreatorProps={{
          creatorButtonText: '测试添加数据',
          record: { id: 9999 },
        }}
        columns={columns}
        value={defaultData}
      />,
    );
    await waitForComponentToPaint(wrapper, 1100);
    expect(wrapper.asFragment()).toMatchSnapshot();
  });

  it('📝 EditableProTable support controlled', async () => {
    const onChange = jest.fn();
    const wrapper = render(
      <EditableProTable<DataSourceType>
        rowKey={(row) => row.id}
        controlled
        recordCreatorProps={{
          creatorButtonText: '测试添加数据',
          record: { id: 9999 },
        }}
        editable={{
          editableKeys: ['624748504'],
        }}
        columns={columns}
        value={[
          {
            id: '624748504',
            title: '🐛 [BUG]yarn install命令 antd2.4.5会报错',
            labels: [{ name: 'bug', color: 'error' }],
            time: {
              created_at: '2020-05-26T09:42:56Z',
            },
            state: 'processing',
          },
        ]}
        onChange={onChange}
      />,
    );
    await waitForComponentToPaint(wrapper, 1100);

    expect(
      wrapper.container.querySelectorAll<HTMLInputElement>(
        '.ant-table-cell .ant-form-item-control-input input',
      )[1].value,
    ).toBe('🐛 [BUG]yarn install命令 antd2.4.5会报错');

    act(() => {
      wrapper.rerender(
        <EditableProTable<DataSourceType>
          rowKey={(row) => row.id}
          controlled
          recordCreatorProps={{
            creatorButtonText: '测试添加数据',
            record: { id: 9999 },
          }}
          editable={{
            editableKeys: ['624748504'],
          }}
          columns={columns}
          value={[
            {
              id: '624748504',
              title: '🐛 [BUG]无法创建工程npm create umi',
              labels: [{ name: 'bug', color: 'error' }],
              time: {
                created_at: '2020-05-26T09:42:56Z',
              },
              state: 'processing',
            },
          ]}
          onChange={onChange}
        />,
      );
    });

    await waitForComponentToPaint(wrapper, 100);
    expect(
      wrapper.container.querySelectorAll<HTMLInputElement>(
        '.ant-table-cell .ant-form-item-control-input input',
      )[1].value,
    ).toBe('🐛 [BUG]无法创建工程npm create umi');
  });

  it('📝 EditableProTable support nested children column without config "childrenColumnName:children" and "position:top"', async () => {
    const fn = jest.fn();
    const wrapper = render(
      <EditableProTable<DataSourceType>
        rowKey="id"
        pagination={{
          pageSize: 2,
          current: 2,
        }}
        editable={{
          onChange: (keys) => fn(keys[0]),
        }}
        recordCreatorProps={{
          parentKey: () => 6246747901,
          record: {
            id: 555,
          },
          id: 'addEditRecord',
        }}
        columns={columns}
        value={[
          {
            id: 624674790,
            title: '🧐 [问题] build 后还存在 es6 的代码（Umi@2.13.13）',
            labels: [{ name: 'question', color: 'success' }],
            state: 'open',
            time: {
              created_at: '2020-05-26T07:54:25Z',
            },
            children: [
              {
                id: 6246747901,
                title: '嵌套数据的编辑',
                labels: [{ name: 'question', color: 'success' }],
                state: 'closed',
                time: {
                  created_at: '2020-05-26T07:54:25Z',
                },
              },
            ],
          },
        ]}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);

    await act(async () => {
      (await wrapper.queryAllByText('添加一行数据')).at(0)?.click();
    });

    await waitForComponentToPaint(wrapper, 1000);

    expect(fn).toBeCalledWith(555);

    wrapper.unmount();
  });
});
