import { Card, Col, Row, Typography, Statistic, Tabs, Table, Tag, Button, Tooltip, DatePicker } from "antd";
import { UserOutlined, CheckCircleOutlined, ClockCircleOutlined, StopOutlined } from "@ant-design/icons";
import {CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis} from "recharts";
import {StatCards} from "./StatCards";
import {AdTrendChart} from "./AdTrendChart";
import {CategoryDistributionChart} from "./CategoryDistributionChart";
import {RecentActivity} from "./RecentActivity";
import {RecentReportsTable} from "./RecentReportsTable";
import {useEffect, useState} from "react";
import axios from "axios";
import { API_URL } from "../../api";
import { TOKEN_KEY } from "../../providers/authProvider";
import { axiosWithHeaders } from "../../providers/dataApiProvider";
import type { Moment } from "moment";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { UserDistributionChart } from "./UserDistributionChart";
import { CategoryDistributionBarChart } from "./CategoryDistributionBarChart";
import { AdsByCountyChart } from "./AdsByCountChart";

const { Title } = Typography;

export const DashboardPage = () => {
    const [widgetsData, setWidgetsData] = useState({
        approved: {
            totalCurrentWeek: 0,
            totalLastWeek: 0,
            percentChange: 0
        },
        pending: 0,
        inactive: {
            totalCurrentWeek: 0,
            totalLastWeek: 0,
            percentChange: 0
        },
        users: {
            totalCurrentWeek: 0,
            totalLastWeek: 0,
            percentChange: 0
        }
    });
    const [categoryDistributionData, setCategoryDistributionData] = useState([]);
    const [adTrendData, setAdTrendData] = useState([]);
    const [userDistributionData, setUserDistributionData] = useState([]);
    const [adsByCountyData, setAdsByCountyData] = useState([]);

    const token = localStorage.getItem(TOKEN_KEY);


    useEffect(() => {
        const fetchData = async () => {
            let url = `${API_URL}/admin/stats/widgets`;

            if (selectedRange) {
                const [start, end] = selectedRange;
                const query = `?start=${start.toISOString()}&end=${end.toISOString()}`;
                url += query;
            }

            const [widgetsRes, categoryRes, trendRes, userTypeRes, adsByCountyRes] = await Promise.all([
                axiosWithHeaders.get(url),
                axiosWithHeaders.get(`${API_URL}/admin/stats/category-distribution`),
                axiosWithHeaders.get(`${API_URL}/admin/stats/ad-trend`),
                axiosWithHeaders.get(`${API_URL}/admin/stats/user-type-distribution`),
                axiosWithHeaders.get(`${API_URL}/admin/stats/ads-by-county`)
            ]);

            setWidgetsData(widgetsRes.data);
            setCategoryDistributionData(categoryRes.data);
            setAdTrendData(trendRes.data);
            setUserDistributionData(userTypeRes.data);
            setAdsByCountyData(adsByCountyRes.data);
        };


        fetchData();

        const interval = setInterval(() => {
            fetchData();
        }, 3_000); // 3 secunde

        // curățăm intervalul când componenta se demontează
        return () => clearInterval(interval);
    }, []);

    const [selectedRange, setSelectedRange] = useState<[Dayjs, Dayjs]>([
        dayjs().startOf("week").subtract(7, "days"),
        dayjs().endOf("week")
    ]);
    return (
        <>
            <Title level={2}>Dashboard</Title>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col>
                    <DatePicker.RangePicker
                        picker="week"
                        value={selectedRange}
                    />
                </Col>
            </Row>
            <StatCards data={widgetsData}/>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} md={12}>
                    <Card title="Ad Trend">
                        <AdTrendChart data={adTrendData} />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title="User Type Distribution">
                        {/*<CategoryDistributionChart data={categoryDistributionData}/>*/}
                        <UserDistributionChart data={userDistributionData}/>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} md={12}>
                    <Card title="Category Distribution">
                        <CategoryDistributionBarChart data={categoryDistributionData}/>
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title="Top Ads By County">
                        <AdsByCountyChart data={adsByCountyData}/>
                    </Card>
                </Col>
            </Row>
        </>
    );
};


