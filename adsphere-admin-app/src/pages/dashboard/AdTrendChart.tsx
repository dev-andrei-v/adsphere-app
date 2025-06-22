import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const AdTrendChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={500}>
        <LineChart data={data} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date"  label={{ value: 'Data', position: 'insideBottom', offset: -10 }}  />
            <YAxis allowDecimals={false} label={{ value: 'COUNT OF ADS', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={3} />
        </LineChart>
    </ResponsiveContainer>
);
