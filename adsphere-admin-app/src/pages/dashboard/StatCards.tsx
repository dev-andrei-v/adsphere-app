import {Card, Col, Row, Statistic, Tooltip} from "antd";
import {
    UserOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    StopOutlined, ArrowUpOutlined, ArrowDownOutlined,
} from "@ant-design/icons";
import {ReactNode} from "react";

interface StatCardProps {
    title: string;
    value: number;
    lastWeekValue?: number;
    icon: ReactNode;
    percent?: number;
    showSuffix?: boolean;
}

const formatSuffix = (percent?: number) => {
    if (percent === undefined || isNaN(percent)) return "";

    const color = percent >= 0 ? "#3f8600" : "#cf1322";
};

export const StatCard = ({ title, value, lastWeekValue, icon, percent, showSuffix = true }: StatCardProps) => {
    const hasPercent = percent !== undefined && !isNaN(percent) && percent !== 0;
    const colorValue = hasPercent && percent! >= 0 ? "#3f8600" : "#cf1322";
    const arrow = hasPercent ? (percent! >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />) : null;
    const percentFormatted = hasPercent ? `${percent!.toFixed(1)}%` : "";
    const style = { color: hasPercent ? colorValue : undefined};
    const suffixStyle = {
        ...style,
        marginLeft: "15px"
    }
    return (
        <Card>
            <Statistic
                title={title}
                value={value}
                prefix={icon}
                valueStyle={style}
                suffix={showSuffix && hasPercent ? (
                    <span style={suffixStyle}>
                        <Tooltip title="Față de săptămâna trecută">
                              {arrow} {percentFormatted}
                        </Tooltip>
                    </span>
                ) : undefined}
            />
        </Card>
    );
};


export interface StatsWidgetResponse {
    approved: {
        totalCurrentWeek: number;
        totalLastWeek: number;
        percentChange: number;
    };
    pending: number;
    inactive: {
        totalCurrentWeek: number;
        totalLastWeek: number;
        percentChange: number;
    };
    users: {
        totalCurrentWeek: number;
        totalLastWeek: number;
        percentChange: number;
    };
}

interface StatCardsProps {
    data: StatsWidgetResponse;
}

export const StatCards = ({ data }: StatCardsProps) => {
    const statisticStyle = { background: "#fff", borderRadius: 8 };
    const activeUsersTotal = data?.users?.totalCurrentWeek ?? 0;
    const activeUsersPercent = data?.users?.percentChange ?? 0;


    const approvedTotal = data?.approved?.totalCurrentWeek ?? 0;
    const approvedPercent = data?.approved?.percentChange ?? 0;
    const inactiveTotal = data?.inactive?.totalCurrentWeek ?? 0;
    const inactivePercent = data?.inactive.percentChange ?? 0;
    const pendingTotal = data?.pending ?? 0;
    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
                <StatCard
                    title="Utilizatori Activi"
                    value={activeUsersTotal}
                    icon={<UserOutlined />}
                    percent={activeUsersPercent}
                />
            </Col>

            <Col xs={24} sm={12} md={6}>
                <StatCard
                    title="Anunțuri Active"
                    value={approvedTotal}
                    icon={<CheckCircleOutlined />}
                    percent={approvedPercent}
                />
            </Col>

            <Col xs={24} sm={12} md={6}>
                <StatCard
                    title="În Verificare"
                    value={pendingTotal}
                    icon={<ClockCircleOutlined />}
                    showSuffix={false}
                />
            </Col>

            <Col xs={24} sm={12} md={6}>
                <StatCard
                    title="Anunțuri Dezactivate"
                    value={inactiveTotal}
                    icon={<StopOutlined />}
                    percent={inactivePercent}
                />
            </Col>
        </Row>
    );
};
