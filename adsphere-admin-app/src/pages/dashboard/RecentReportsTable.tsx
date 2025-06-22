import {Button, Card, Table, Tag} from "antd";

const EyeIcon = () => <span role="img" aria-label="view">👁️</span>;

export const RecentReportsTable = () => {
    return (
        <Card title="Raportări recente" extra={<Button type="link">Vezi toate</Button>}>
            <Table
                dataSource={[
                    {
                        key: '1',
                        id: 'R-2587',
                        reclamatie: 'Anunț înșelător',
                        status: 'În așteptare',
                    },
                    {
                        key: '2',
                        id: 'R-2586',
                        reclamatie: 'Conținut inadecvat',
                        status: 'În procesare',
                    },
                    {
                        key: '3',
                        id: 'R-2585',
                        reclamatie: 'Preț incorect',
                        status: 'Rezolvat',
                    },
                ]}
                columns={[
                    {
                        title: 'ID',
                        dataIndex: 'id',
                    },
                    {
                        title: 'Reclamație',
                        dataIndex: 'reclamatie',
                    },
                    {
                        title: 'Status',
                        dataIndex: 'status',
                        render: (text) => {
                            const color =
                                text === 'Rezolvat' ? 'green' :
                                    text === 'În procesare' ? 'blue' :
                                        'orange';
                            return <Tag color={color}>{text}</Tag>;
                        }
                    },
                    {
                        title: 'Acțiuni',
                        render: () => <Button icon={<EyeIcon />} />
                    }
                ]}
                pagination={false}
                size="small"
            />
        </Card>
    )
}
