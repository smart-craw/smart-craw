import { Table, Popconfirm, Button } from "antd";

import type { TableProps } from "antd";
import type { Bot } from "../state/bot";
import type { ExpandableConfig } from "antd/es/table/interface";

function setColumns(
  onConfirm: (id: string, toolName: string) => () => void,
  execute: (id: string) => () => void,
): TableProps<Bot>["columns"] {
  return [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
      //render: (text) => <a>{text}</a>,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <a>{text}</a>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Approval",
      key: "approval",
      render: (_, { id, approval }) =>
        approval && (
          <Popconfirm
            placement="top"
            title={approval.toolName}
            description={JSON.stringify(approval.input)}
            okText="Yes"
            cancelText="No"
            onConfirm={onConfirm(id, approval.toolName)}
          >
            <Button>Approval</Button>
          </Popconfirm>
        ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, row) => <Button onClick={execute(row.id)}>Run</Button>,
    },
  ];
}

interface Props {
  data: Bot[];
  onConfirm: (id: string, toolName: string) => () => void;
  execute: (id: string) => () => void;
}
const defaultExpandable: ExpandableConfig<Bot> = {
  expandedRowRender: (record: Bot) => <p>{record.instructions}</p>,
};
const BotList: React.FC<Props> = ({ data, onConfirm, execute }: Props) => (
  <Table<Bot>
    expandable={defaultExpandable}
    columns={setColumns(onConfirm, execute)}
    dataSource={data.map((v) => ({ ...v, key: v.id }))}
  />
);

export default BotList;
