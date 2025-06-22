import {AuthPage, ThemedTitleV2} from "@refinedev/antd";
import {SettingOutlined} from "@ant-design/icons";

export const Login = () => {
  return (
    <AuthPage
        title={<h3>AdSphere Admin</h3>}
      type="login"
        forgotPasswordLink={false}
        registerLink={false}
        rememberMe={false}
      contentProps={{

      }}
      formProps={{
        initialValues: { email: "", password: "" },
      }}
    />
  );
};
