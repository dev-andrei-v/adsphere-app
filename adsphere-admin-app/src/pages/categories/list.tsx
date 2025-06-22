import {
    DeleteButton,
    EditButton,
    List,
    ShowButton,
    useTable,
} from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Space, Table } from "antd";
import Input from "antd/lib/input";
import {useState} from "react";

export const CategoryList = () => {
    const { tableProps } = useTable({
        resource: "admin/categories",
        pagination: {
            pageSize: 20,
            current: 1
        },
        filters: {
            mode: "server"
        },
        syncWithLocation: false
    });

    const [search, setSearch] = useState("");

    return (
        <List>
            {/*<Input.Search*/}
            {/*    placeholder="Search by name"*/}
            {/*    value={search}*/}
            {/*    onChange={(e) => setSearch(e.target.value)}*/}
            {/*    onSearch={() => {*/}
            {/*        tableProps.onChange?.(*/}
            {/*            {*/}
            {/*                ...tableProps.pagination,*/}
            {/*                current: 1,*/}
            {/*            },*/}
            {/*            {}, // AntD filters (nu folosit în Refine)*/}
            {/*            {}, // AntD sorter (nu folosit în Refine aici)*/}
            {/*            {*/}
            {/*                action: "filter",*/}
            {/*                currentDataSource: [],*/}
            {/*                currentFilters: [*/}
            {/*                    {*/}
            {/*                        field: "name",*/}
            {/*                        operator: "contains",*/}
            {/*                        value: search,*/}
            {/*                    },*/}
            {/*                ],*/}
            {/*            }*/}
            {/*        );*/}
            {/*        // tableProps.onChange?.(*/}
            {/*        //     {*/}
            {/*        //         ...tableProps.pagination,*/}
            {/*        //         current: 1,*/}
            {/*        //     },*/}
            {/*        //     [],*/}
            {/*        //     [*/}
            {/*        //         {*/}
            {/*        //             field: "name",*/}
            {/*        //             operator: "contains",*/}
            {/*        //             value: search,*/}
            {/*        //         },*/}
            {/*        //     ],*/}
            {/*        // );*/}
            {/*    }}*/}
            {/*    allowClear*/}
            {/*    style={{ marginBottom: 16, maxWidth: 300 }}*/}
            {/*/>*/}


            <Table {...tableProps} rowKey="_id">
                <Table.Column dataIndex="_id" title="ID"/>
                <Table.Column dataIndex="name" title="Name" />
                <Table.Column dataIndex="slug" title="Slug" />
                <Table.Column
                    title="Actions"
                    dataIndex="actions"
                    render={(_, record: BaseRecord) => (
                        <Space>
                            <EditButton hideText size="small" recordItemId={record._id} />
                            <ShowButton hideText size="small" recordItemId={record._id} />
                            {/*<DeleteButton hideText size="small" recordItemId={record.id} />*/}
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
