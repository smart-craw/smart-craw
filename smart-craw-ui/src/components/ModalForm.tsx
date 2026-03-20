import { Input, Typography } from "antd";
import type { InputStatus } from "antd/es/_util/statusUtils";

const { Text } = Typography;
type FormProps = {
  title: string;
  helpText: string;
  type?: string;
  status?: InputStatus;
  value?: string;
  onChange: React.ChangeEventHandler<HTMLInputElement, HTMLInputElement>;
};
const FormItem = ({
  title,
  helpText,
  type,
  status,
  value,
  onChange,
}: FormProps) => {
  return (
    <div>
      <p style={{ margin: 5 }}>{title}</p>
      <Input type={type} status={status} value={value} onChange={onChange} />
      <Text type="secondary">{helpText}</Text>
    </div>
  );
};

export default FormItem;
