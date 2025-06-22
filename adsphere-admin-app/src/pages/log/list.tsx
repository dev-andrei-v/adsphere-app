import { DateField, EditButton, List, ShowButton, TagField, useTable } from "@refinedev/antd";
import { Button, Form, Space, Table } from "antd";
import Input from "antd/lib/input";
import { useNavigate } from "react-router";

const TagColor = (value: string) => {
    const upper = value.toUpperCase();

    const colorMap: Record<string, string> = {
        EDIT_AD: "blue",
        APPROVE_AD: "green",
        REJECT_AD: "red",
    };

    return <TagField value={upper} color={colorMap[upper] || "default"} />;
};

export const LogsList = () => {
    const navigate = useNavigate();

    const {tableProps, searchFormProps} = useTable({
        resource: "admin/logs",
        pagination: {
            pageSize: 20,
            current: 1
        },
        filters: {
            mode: "server"
        },
        syncWithLocation: false,
        onSearch: (values: any) => {
            console.log("search form values:", values);
            return [
                {
                    field: "q",
                    operator: "eq",
                    value: values.q,
                },
            ];
        },
    });

    return (
        <List>
            <Form layout="inline" {...searchFormProps} style={{ marginBottom: 16, width: "100%" }}>
                <Form.Item name="q" style={{ flex: 1, minWidth: 250 }}>
                    <Input placeholder="Search..." allowClear />
                </Form.Item>
                <Form.Item>
                    <Button htmlType="submit" type="primary">Search</Button>
                </Form.Item>
            </Form>

            <Table {...tableProps} rowKey="_id">
                <Table.Column dataIndex="_id" title="ID"
                              render={(value) => value}
                />
                <Table.Column dataIndex="createdAt" title="Posted"
                              minWidth={180}
                              render={(value) => <DateField value={value} format="DD.MM.YYYY HH:mm:ss"/>}
                />
                <Table.Column
                    dataIndex="by"
                    title="By"
                    render={(value: string) =>
                        value !== 'AdSphere AI Service' ? (
                            <Button onClick={() => navigate(`/users?q=${encodeURIComponent(value)}`)}>
                                {value}
                            </Button>
                        ) : (
                            'AdSphere AI Service'
                        )
                    }
                    minWidth={190}
                />

                <Table.Column dataIndex="message" title="Message"
                              render={(value) => value}
                              minWidth={200}
                />

                <Table.Column dataIndex="logType" title="Type"
                              render={(value) => TagColor(value)} />
                <Table.Column dataIndex="logAction" title="Type"
                              render={(value) => TagColor(value)} />

            </Table>
        </List>
    );
}
