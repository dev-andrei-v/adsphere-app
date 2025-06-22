import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from 'recharts';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const AdsByCountyChart = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height={600}>
            <BarChart
                layout="vertical"
                data={data}
                margin={{ top: 20, right: 30, left: 100, bottom: 40 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="county" />
                <Tooltip />
                <Bar dataKey="totalAds" fill="#82ca9d" />
            </BarChart>
        </ResponsiveContainer>
    );
};
