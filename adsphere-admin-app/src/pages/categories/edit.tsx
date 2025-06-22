import {
    Edit,
    useForm,
} from "@refinedev/antd";
import {
    Form,
    Input,
    Button,
    Divider, Switch,
    Upload,
} from "antd";
import {
    PlusOutlined, UploadOutlined,
} from "@ant-design/icons";

import { useParams } from "react-router-dom";
import { AttributeFields } from "./attributeFields";
import {useEffect, useState} from "react"; // same component as in Create

export const CategoryEdit = () => {
    const { id } = useParams();

    const { formProps, saveButtonProps, queryResult } = useForm({
        resource: "admin/categories",
        id,
        action: "edit",
        redirect: "show",
        onMutationSuccess: async (data: any) => {
            console.log(data);
        },
    });

    const [fileList, setFileList] = useState<any[]>([]);
    const categoryData = queryResult?.data?.data;

    useEffect(() => {
        if (categoryData?.image?.url) {
            setFileList([
                {
                    uid: "-1",
                    name: "existing-image.png",
                    status: "done",
                    url: categoryData.image.url,
                },
            ]);
        }
    }, [categoryData]);

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Form.Item
                    label="Name"
                    name="name"
                    rules={[{ required: true }]}>
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Parent Id"
                    name="parentId">
                    <Input />
                </Form.Item>

                <Form.Item label="Image">
                    <Upload
                        listType="picture"
                        fileList={fileList}
                        onChange={({ fileList }) => setFileList(fileList)}
                        showUploadList={{ showRemoveIcon: false }}
                        disabled
                    >
                        <Button icon={<UploadOutlined />}>Category Image (preview only)</Button>
                    </Upload>
                </Form.Item>

                <Form.Item
                    label="Is Enabled"
                    name="isEnabled"
                    valuePropName="checked"
                    initialValue={true}>
                    <Switch />
                </Form.Item>

                <Form.Item
                    label="Is Featured"
                    name="isFeatured"
                    valuePropName="checked"
                    initialValue={false}>
                    <Switch />
                </Form.Item>

                <Divider>Attributes</Divider>

                <Form.List name="attributes">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name }) => (
                                <AttributeFields key={key} name={name} remove={remove} />
                            ))}

                            <Form.Item style={{ marginTop: "26px" }}>
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<PlusOutlined />}>
                                    Add Attribute
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
            </Form>
        </Edit>
    );
};
