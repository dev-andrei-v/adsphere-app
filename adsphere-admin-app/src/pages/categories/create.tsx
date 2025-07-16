import {
    Create, getValueFromEvent,
    useForm, useSelect,
} from "@refinedev/antd";
import {
    Form,
    Input,
    Button,
    Divider, Switch,
    Upload, Select,
} from "antd";
import {
    PlusOutlined, UploadOutlined,
} from "@ant-design/icons";
import {AttributeFields} from "./attributeFields";
import axios from "axios";
import {TOKEN_KEY} from "../../providers/authProvider";
import {useState} from "react";
import { API_URL } from "../../api";

export const CategoryCreate = () => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const {formProps, saveButtonProps} = useForm({
        resource: "admin/categories",
        onMutationSuccess: async ({ data }) => {
            const newCategory = data as any;
            const newId = newCategory.id;
            if(uploadedFile && newId){
                const formData = new FormData();
                formData.append("image", uploadedFile);
                try {
                    await axios.post(
                        `${API_URL}/admin/categories/${newId}/image`,
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                                Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
                            },
                        }
                    );
                } catch (error) {
                    console.error("Error uploading image:", error);
                }
            }
        }

    });

    const { selectProps: parentCategorySelectProps } = useSelect({
        resource: "categories/featured",
        optionLabel: "name",
        optionValue: "id",
    });

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Form.Item
                    label="Name"
                    name="name"
                >
                    <Input/>
                </Form.Item>
                <Form.Item label="Image">
                    <Form.Item
                        noStyle
                    >
                        <Upload
                            name="image"
                            listType="picture"
                            maxCount={1}
                            beforeUpload={(file) => {
                                setUploadedFile(file);
                                return false;
                            }}
                            onRemove={() => {
                                setUploadedFile(null);
                            }}
                        >
                            <Button icon={<UploadOutlined/>}>
                                Upload Category Image
                            </Button>
                        </Upload>
                    </Form.Item>
                </Form.Item>

                <Form.Item
                    label="Parent Category"
                    name="parentId"
                >
                    <Select
                        {...parentCategorySelectProps}
                        allowClear
                        placeholder="Select parent category (optional)"
                    />
                </Form.Item>

                <Form.Item
                    label="Is Enabled"
                    name="isEnabled"
                    valuePropName="checked"
                    initialValue={true}
                >
                    <Switch/>
                </Form.Item>

                <Form.Item
                    label="Is Featured"
                    name="isFeatured"
                    valuePropName="checked"
                    initialValue={false}
                >
                    <Switch/>
                </Form.Item>

                <Divider>Attributes</Divider>

                <Form.List name="attributes">
                    {(fields, {add, remove}) => (
                        <>
                            {fields.map(({key, name}) => (
                                <AttributeFields key={key} name={name} remove={remove}/>
                            ))}

                            <Form.Item>
                                <Button
                                    type="dashed" onClick={() => add()} block icon={<PlusOutlined/>}>
                                    Add Attribute
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
            </Form>
        </Create>
    );
};
