import { List, Popconfirm, Button } from "antd";

import type { Bot } from "../state/bot";

/*function setColumns(
  onConfirm: (id: string, toolName: string) => () => void,
  execute: (id: string) => () => void,
  stopExecute: (id: string) => () => void,
  onShowMessage: (id: string) => () => void,
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
      //on click, render modal with model messages (use a table that can expand for the Reasoning CoT)
      render: (text, { id }) => <a onClick={onShowMessage(id)}>{text}</a>,
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
      render: (_, row) =>
        row.isExecuting ? (
          <Button danger loading onClick={stopExecute(row.id)}>
            Stop
          </Button>
        ) : (
          <Button onClick={execute(row.id)}>Run</Button>
        ),
    },
  ];
}*/

interface Props {
  data: Bot[];
  onConfirm: (id: string, toolName: string) => () => void;
  execute: (id: string) => () => void;
  stopExecute: (id: string) => () => void;
  onDelete: (id: string) => () => void;
  onShowMessage: (id: string) => () => void;
}
/*const defaultExpandable: ExpandableConfig<Bot> = {
  expandedRowRender: (record: Bot) => <p>{record.instructions}</p>,
};*/
const BotList: React.FC<Props> = ({
  data,
  onConfirm,
  execute,
  stopExecute,
  onDelete,
  onShowMessage,
}: Props) => (
  /*<Table<Bot>
    expandable={defaultExpandable}
    columns={setColumns(onConfirm, execute, stopExecute, onShowMessage)}
    dataSource={data.map((v) => ({ ...v, key: v.id }))}
  />*/
  <List
    //loading={initLoading}
    itemLayout="horizontal"
    dataSource={data}
    renderItem={({
      approval,
      id,
      isExecuting,
      name,
      instructions,
      description,
    }) => (
      <List.Item
        key={id}
        actions={[
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
          isExecuting ? (
            <Button danger loading onClick={stopExecute(id)}>
              Stop
            </Button>
          ) : (
            <Button type="primary" onClick={execute(id)}>
              Run
            </Button>
          ),
          <Button onClick={onDelete(id)}>Delete</Button>,
        ]}
      >
        <List.Item.Meta
          //avatar={<Avatar src={item.avatar} />}
          title={<a onClick={onShowMessage(id)}>{name}</a>}
          description={instructions}
        />

        <div>{description}</div>
      </List.Item>
    )}
  />
);
export default BotList;
