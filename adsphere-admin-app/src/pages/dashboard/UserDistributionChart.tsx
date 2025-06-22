import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = [
    '#ff8042', // portocaliu
    '#8884d8', // mov
    // '#82ca9d', // verde pastel
    // '#ffc658', // galben
    // '#8dd1e1', // albastru deschis
    // '#a4de6c', // verde lime
    // '#d0ed57', // galben-verzui
    // '#a28fd0'  // mov pal
];

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const UserDistributionChart = ({ data }) => {
    const renderCustomizedLabel = ({ percent }: { percent: number }) => {
        return `${(percent * 100).toFixed(1)}%`;
    };

    return (
        <ResponsiveContainer width="100%" height={500}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={180}
                    label={renderCustomizedLabel}
                >
                    {data?.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
            </PieChart>
        </ResponsiveContainer>
    );
};
