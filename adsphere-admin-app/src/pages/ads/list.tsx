import {
    DateField,
    DeleteButton,
    EditButton,
    List,
    ShowButton, TagField,
    useTable,
} from "@refinedev/antd";
import type {BaseRecord} from "@refinedev/core";
import { Button, Form, Space, Table } from "antd";
import Input from "antd/lib/input";
import { useEffect, useState } from "react";
import { CLIENT_UI_URL } from "../../api";
import { useSearchParams } from "react-router";
import { Text } from "recharts";

export const AdList = () => {
    const [searchParams] = useSearchParams();
    const q = searchParams.get("q") || "";

    const {tableProps, searchFormProps} = useTable({
        resource: "admin/ads",
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
            <Form layout="inline" {...mergedSearchFormProps} style={{ marginBottom: 16, width: "100%" }}>
                <Form.Item name="q" style={{ flex: 1, minWidth: 250 }}>
                    <Input placeholder="Search by ID, title, user ID" allowClear
                    />
                </Form.Item>
                <Form.Item>
                    <Button htmlType="submit" type="primary">Search</Button>
                </Form.Item>
            </Form>

            <Table {...tableProps} rowKey="_id">
                <Table.Column dataIndex="_id" title="ID"/>
                <Table.Column dataIndex="title" title="Title"/>
                <Table.Column
                    dataIndex="status"
                    title="Status"
                    render={(value: string) => <TagField value={value} />}
                />
                <Table.Column dataIndex="createdAt" title="Posted"
                              render={(value) => <DateField value={value}/>}
                />
                <Table.Column dataIndex="updatedAt" title="Updated"
                              render={(value) => <DateField value={value}/>}
                />
                <Table.Column dataIndex="price" title="Price"/>
                <Table.Column dataIndex="currency" title="Currency"/>

                <Table.Column
                    title="Actions"
                    dataIndex="actions"
                    render={(_, record: BaseRecord) => (
                        <Space>
                            <EditButton hideText size="small" recordItemId={record._id}/>
                            <ShowButton hideText size="small" onClick={() => window.open(
                                `${CLIENT_UI_URL}/ads/${record._id}`,
                                "_blank"
                            )} />

                        </Space>
                    )}
                />
            </Table>
        </List>
    );
}


