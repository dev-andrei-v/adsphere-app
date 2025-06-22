import {
    Edit,
    useForm,
    useSelect
} from "@refinedev/antd";
import {Form, Input, InputNumber, Select} from "antd";
import {useParams} from "react-router-dom";

export const AdEdit = () => {
    const adStatuses: { label: string; value: string }[] = [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
        { label: "Archived", value: "archived" },
        { label: "Deleted", value: "deleted" }
    ];

    const transactionTypes: { label: string; value: string }[] = [
        { label: "Fixed", value: "fixed" },
        { label: "Negotiable", value: "negotiable" },
        { label: "Auction", value: "auction" },
        { label: "Free", value: "free" },
        { label: "Exchange", value: "exchange" },
        { label: "Not specified", value: "not_specified" }
    ];

    const { id } = useParams();

    const { formProps, saveButtonProps} = useForm({
        resource: "admin/ads",
        id,
        action: "edit",
        redirect: "show", // or "list" after edit
    });

    const {selectProps: categorySelectProps} = useSelect({
        resource: "admin/categories",
        optionLabel: "name",
        optionValue: "id",
    });

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Form.Item label="Title" name="title" rules={[{required: true}]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Description" name="description" rules={[{required: true}]}>
                    <Input.TextArea rows={4} />
                </Form.Item>
                <Form.Item label="Price" name="price" rules={[{required: true}]}>
                    <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item label="Currency" name="currency" rules={[{required: true}]}>
                    <Select options={[
                        { label: "RON", value: "RON" },
                        { label: "EURO", value: "EURO" },
                    ]} />
                </Form.Item>
                <Form.Item label="Transaction Type" name="priceType">
                    <Select options={transactionTypes} />
                </Form.Item>
                <Form.Item label="Category" name="categoryId">
                    <Select {...categorySelectProps} />
                </Form.Item>
                <Form.Item label="Status" name="status">
                    <Select options={adStatuses} />
                </Form.Item>
            </Form>
        </Edit>
    );
};
