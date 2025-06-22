import {
    DateField,
    DeleteButton,
    EditButton,
    List,
    ShowButton,
    useTable,
} from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Button, Form, Space, Table } from "antd";
import Input from "antd/lib/input";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

export const UserList = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const q = searchParams.get("q") || "";
    const { tableProps, searchFormProps } = useTable({
        resource: "admin/users",
        pagination: {
            pageSize: 20,
            current: 1
        },
        filters: {
            mode: "server"
        },
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
        syncWithLocation: false
    });

    useEffect(() => {
        if (q && searchFormProps.form) {
            searchFormProps.form.setFieldsValue({ q });
            searchFormProps.form.submit(); // triggers onSearch
        }
    }, [q, searchFormProps.form]);

    const mergedSearchFormProps = {
        ...searchFormProps,
        initialValues: { q: q || "" },
    };

    return (
        <List>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span>Default password for fake generated users: <b>Password12345!</b></span>
                <Button
                    size="small"
                    onClick={() => {
                        navigator.clipboard.writeText("Password12345!");
                    }}
                >
                    Copy
                </Button>
            </div>
            <Form layout="inline" {...searchFormProps} style={{ marginBottom: 16, width: "100%" }}>
                <Form.Item name="q" style={{ flex: 1, minWidth: 250 }}>
                    <Input placeholder="Search..." allowClear />
                </Form.Item>
                <Form.Item>
                    <Button htmlType="submit" type="primary">Search</Button>
                </Form.Item>
            </Form>
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="id" title="ID"
                              render={(value) => value}
                              minWidth={50}
                />
                <Table.Column dataIndex="name" title="Name" />
                <Table.Column dataIndex="type" title="Type" />
                <Table.Column dataIndex="email" title="Email" minWidth={200} />
                <Table.Column dataIndex="authProvider" title="Auth Provider" />
                <Table.Column dataIndex="lastLoginAt" title="Last Login"
                              minWidth={180}
                              render={(value) => <DateField value={value} format="DD.MM.YYYY HH:mm:ss"/>}
                />
                <Table.Column dataIndex="lastSeenAt" title="Last Seen"
                              minWidth={180}
                              render={(value) => <DateField value={value} format="DD.MM.YYYY HH:mm:ss"/>}
                />
                <Table.Column dataIndex="createdAt" title="Joined At"
                              minWidth={180}
                              render={(value) => <DateField value={value} format="DD.MM.YYYY HH:mm:ss"/>}
                />
                <Table.Column
                    title="Actions"
                    dataIndex="actions"
                    render={(_, record: BaseRecord) => (
                        <Space>
                            <Button
                                onClick={() => navigate(`/ads?q=${record.id}`)}
                            >View Posted Ads</Button>
                            {/*    Posted Ads ({record.postedAdsCount})*/}
                            {/*</Button>*/}
                            {/*<EditButton hideText size="small" recordItemId={record.id} />*/}
                            {/*<ShowButton hideText size="small" recordItemId={record.id} />*/}
                            {/*<DeleteButton hideText size="small" recordItemId={record.id} />*/}
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
