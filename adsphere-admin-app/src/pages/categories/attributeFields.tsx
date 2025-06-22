import { Form, Input, InputNumber, Select, Button, Space, Divider, Switch } from "antd";
import { MinusCircleOutlined } from "@ant-design/icons";
import { useWatch } from "antd/es/form/Form";
import {useEffect} from "react";

const ATTRIBUTE_TYPES = [
    { label: "Text", value: "text" },
    { label: "Number", value: "number" },
    { label: "Select", value: "select" },
];

export const AttributeFields = ({ name, remove }: { name: number; remove: (index: number) => void }) => {
    const form = Form.useFormInstance();
    const type = useWatch(["attributes", name, "type"]);

    useEffect(() => {
        if (!type) return;

        const basePath = ["attributes", name];

        const clear = (fields: string[]) => {
            for (const field of fields) {
                form.setFieldValue([...basePath, ...field.split(".")], undefined);
            }
        };

        const clearWhole = (fields: string[]) => {
            for (const field of fields) {
                form.setFieldValue([...basePath, field], undefined);
            }
        };

        switch (type) {
            case "text":
                clear(["options", "validation.minValue", "validation.maxValue"]);
                break;
            case "number":
                clear(["options", "validation.regex"]);
                break;
            case "select":
                clearWhole(["validation"]);
                break;
        }
    }, [type, name, form]);

    return (
        <div>
        <Space
            style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
            }}
            align="start"
        >
            <Form.Item name={[name, "key"]} label="Key" rules={[{ required: true }]}>
                <Input placeholder="ex: brand" />
            </Form.Item>

            <Form.Item name={[name, "label"]} label="Label" rules={[{ required: true }]}>
                <Input placeholder="ex: Brand" />
            </Form.Item>

            <Form.Item name={[name, "type"]} label="Type" rules={[{ required: true }]}>
                <Select options={ATTRIBUTE_TYPES} style={{ width: 140 }} />
            </Form.Item>

            {type === "select" && (
                <Form.Item name={[name, "options"]} label="Options">
                    <Select mode="tags" placeholder="Only for 'select'" style={{ minWidth: 200 }} />
                </Form.Item>
            )}

            {type === "text" && (
                <Form.Item name={[name, "validation", "regex"]} label="Regex">
                    <Input placeholder="ex: ^[A-Z]{3}$" />
                </Form.Item>
            )}

            {type === "number" && (
                <>
                    <Form.Item name={[name, "validation", "minValue"]} label="Min">
                        <InputNumber />
                    </Form.Item>

                    <Form.Item name={[name, "validation", "maxValue"]} label="Max">
                        <InputNumber />
                    </Form.Item>
                </>
            )}
        </Space>
        <Space style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "12px",
            width: "100%"
        }}>
            <Form.Item name={[name, "validation", "unit"]} label="Unit">
                <Input placeholder="ex: kg, cm, etc." />
            </Form.Item>
            <Form.Item name={[name, "validation", "errorMessage"]} label="Error message displayed to user"
            style={{width: "100%" }}>
                <Input placeholder="ex: Valoarea trebuie să fie între MIN și MAX" />
            </Form.Item>

            <Form.Item
                name={[name, "isRequired"]}
                label="Mandatory attribute for user"
                valuePropName="checked"
            >
                <Switch />
            </Form.Item>

            <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)}/>
        </Space>
        <Divider/>
        </div>
    );
};
