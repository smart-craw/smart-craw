import { Descriptions } from "antd";
type Props = {
  input: Record<string, string>;
};
const ApprovalDescription = ({ input }: Props) => {
  return (
    <Descriptions
      column={1}
      items={Object.entries<string>(input).map(([key, value]) => ({
        key,
        label: key,
        children: value,
      }))}
    />
  );
};

export default ApprovalDescription;
