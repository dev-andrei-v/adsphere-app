import {BooleanField, DateField, Show, TextField} from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { useParams } from "react-router-dom";
import {Divider, Typography} from "antd";
import Paragraph from "antd/es/typography/Paragraph";

const { Title } = Typography;

export const CategoryShow = () => {
    const { id } = useParams();

    const { queryResult } = useShow({
        resource: "admin/categories",
        id,
        queryOptions: {
            enabled: true,
        },
    });
    const { data, isLoading } = queryResult;

    const record = data?.data;

    return (
        <Show isLoading={isLoading}>
            <Title level={5}>ID</Title>
            <TextField value={record?._id} />

            <Title level={5}>Name</Title>
            <TextField value={record?.name} />

            <Title level={5}>Slug</Title>
            <TextField value={record?.slug} />

            <Title level={5}>Is Featured</Title>
            <BooleanField value={record?.isFeatured} />

            <Title level={5}>Is Enabled</Title>
            <BooleanField value={record?.isEnabled} />

            <Title level={5}>Created At</Title>
            <DateField value={record?.createdAt} />

            <Title level={5}>Updated At</Title>
            <DateField value={record?.updatedAt} />

            {record?.attributes?.length > 0 && (
                <>
                    <Divider />
                    <Title level={4}>Attributes</Title>
                    {record?.attributes.map((attr: any, index: number) => (
                        <div key={attr._id || index} style={{ marginBottom: 16 }}>
                            <Title level={5}>Key</Title>
                            <TextField value={attr.key} />

                            <Title level={5}>Label</Title>
                            <TextField value={attr.label} />

                            <Title level={5}>Type</Title>
                            <TextField value={attr.type} />

                            {attr.validation?.regex && (
                                <>
                                    <Title level={5}>Regex</Title>
                                    <TextField value={attr.validation.regex} />
                                </>
                            )}

                            {attr.validation?.minValue !== undefined && (
                                <>
                                    <Title level={5}>Min Value</Title>
                                    <TextField value={attr.validation.minValue} />
                                </>
                            )}

                            {attr.validation?.maxValue !== undefined && (
                                <>
                                    <Title level={5}>Max Value</Title>
                                    <TextField value={attr.validation.maxValue} />
                                </>
                            )}

                            {attr.options && attr.options.length > 0 && (
                                <>
                                    <Title level={5}>Options</Title>
                                    <Paragraph>
                                        {attr?.options.map((opt: string, i: number) => (
                                            <span key={i} style={{ marginRight: 8 }}>
                                                {opt}
                                            </span>
                                        ))}
                                    </Paragraph>
                                </>
                            )}

                            <Divider />
                        </div>
                    ))}
                </>
            )}
        </Show>
    );
};
