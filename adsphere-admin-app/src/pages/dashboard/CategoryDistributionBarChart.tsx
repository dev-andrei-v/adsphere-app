import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis, Bar, LabelList
} from "recharts";

const COLORS = [
    '#8884d8', // mov
    '#82ca9d', // verde pastel
    '#ffc658', // galben
    '#ff8042', // portocaliu
    '#8dd1e1', // albastru deschis
    '#a4de6c', // verde lime
    '#d0ed57', // galben-verzui
    '#a28fd0'  // mov pal
];

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const CategoryDistributionBarChart = ({ data }) => {
    const renderCustomizedLabel = ({ percent }: { percent: number }) => {
        return `${(percent * 100).toFixed(1)}%`;
    };

    return (
        <ResponsiveContainer width="100%" height={600}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} />
                <YAxis label={{ value: 'COUNT OF ADS', angle: -90, position: 'insideLeft' }} />
                <Tooltip />


                <Bar dataKey="totalAds" fill="#8884d8">
                    {data?.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};
