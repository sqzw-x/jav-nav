import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  ColorPicker,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import type { Color } from "antd/es/color-picker";
import { useEffect } from "react";
import {
  extractorMethodLabelMap,
  guardTypeLabelMap,
  matchScopeLabelMap,
  type SiteRule,
  uiPositionLabelMap,
} from "@/rules/types";

const { Title, Text } = Typography;

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export type RuleEditorDrawerProps = {
  open: boolean;
  rule: SiteRule | null;
  onSubmit: (rule: SiteRule) => void | Promise<void>;
  onClose: () => void;
  portalContainer?: HTMLElement | null;
};

const normalizeRule = (values: SiteRule): SiteRule => ({
  ...values,
  matchers: values.matchers ?? [],
  detailPageGuards: values.detailPageGuards ?? [],
  identifierExtractors: values.identifierExtractors ?? [],
  entryPoints: values.entryPoints ?? [],
});

const RuleEditorDrawer = ({ open, rule, onSubmit, onClose, portalContainer }: RuleEditorDrawerProps) => {
  const [form] = Form.useForm<SiteRule>();

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }

    if (rule) {
      form.setFieldsValue(rule);
    } else {
      form.resetFields();
    }
  }, [open, rule, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(normalizeRule(values));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Drawer
      title={rule ? `编辑站点：${rule.name}` : "编辑站点"}
      open={open}
      width={920}
      onClose={onClose}
      zIndex={100010}
      getContainer={portalContainer ?? undefined}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSubmit}>
            保存
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" form={form}>
        <Title level={5}>基础信息</Title>
        <Form.Item label="站点 ID" name="id" rules={[{ required: true, message: "请输入唯一 ID" }]}>
          <Input placeholder="例如 javdb" />
        </Form.Item>
        <Form.Item label="显示名称" name="name" rules={[{ required: true, message: "请输入名称" }]}>
          <Input placeholder="展示名称" />
        </Form.Item>
        <Form.Item
          label="URL 关键词"
          name="keywords"
          rules={[{ required: true, message: "至少一个" }]}
          extra="用于粗匹配, 只有当 host 包含至少其中之一时才会进行后续匹配"
        >
          <Select mode="tags" placeholder="输入后回车确认" />
        </Form.Item>
        <Form.Item label="启用" name="enabled" valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>
        <Divider />

        <Title level={5}>链接构建规则</Title>
        <Text type="secondary">用于生成跳转到此站点的链接, 将在其他站点上展示</Text>
        <Form.List name="entryPoints">
          {(fields, { add, remove }) => (
            <Space direction="vertical" style={{ width: "100%" }}>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} align="baseline" wrap style={{ width: "100%" }}>
                  <Form.Item {...restField} name={[name, "id"]} label="ID" rules={[{ required: true }]}>
                    <Input style={{ width: 140 }} />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "requiredIdentifierType"]}
                    label="所需 ID 类型"
                    rules={[{ required: true }]}
                  >
                    <Input style={{ width: 170 }} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "pattern"]}
                    label="正则表达式"
                    extra="可选, 用于对 ID 进行预处理"
                  >
                    <Input style={{ width: 200 }} />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "replaceWith"]}
                    label="替换模板"
                    extra="当正则存在时生效, 支持捕获组"
                  >
                    <Input style={{ width: 220 }} />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "displayName"]} label="展示名" rules={[{ required: true }]}>
                    <Input style={{ width: 170 }} />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "color"]}
                    label="文本颜色"
                    initialValue="#000000"
                    valuePropName="value"
                    trigger="onChangeComplete"
                    getValueFromEvent={(color: Color) => color.toHexString()}
                  >
                    <ColorPicker format="hex" showText />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "urlTemplate"]}
                    label="URL 模板"
                    rules={[{ required: true }]}
                    extra="可插入 {id} 变量"
                  >
                    <Input style={{ width: 320 }} placeholder="https://foo.com/search/{id}" />
                  </Form.Item>
                  <Button icon={<MinusCircleOutlined />} danger onClick={() => remove(name)} />
                </Space>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add({ id: createId("entry"), displayName: "", color: "#000000" })}
              >
                添加规则
              </Button>
            </Space>
          )}
        </Form.List>
        <Divider />

        <Title level={5}>URL 匹配规则</Title>
        <Text type="secondary">判断是否位于此站点, 允许比 URL 关键词更复杂的规则</Text>
        <Form.List name="matchers">
          {(fields, { add, remove }) => (
            <Space direction="vertical" style={{ width: "100%" }}>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} align="baseline" wrap style={{ width: "100%" }}>
                  <Form.Item
                    {...restField}
                    name={[name, "id"]}
                    label="ID"
                    rules={[{ required: true, message: "请输入 matcher ID" }]}
                  >
                    <Input style={{ width: 120 }} placeholder="matcher-id" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "pattern"]}
                    label="正则表达式"
                    rules={[{ required: true, message: "请输入 pattern" }]}
                  >
                    <Input style={{ width: 240 }} placeholder="支持正则" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "matchScope"]} label="匹配对象" extra="">
                    <Select
                      style={{ width: 140 }}
                      options={Array.from(matchScopeLabelMap, ([value, label]) => ({ value, label }))}
                      placeholder="host"
                    />
                  </Form.Item>
                  <Button icon={<MinusCircleOutlined />} danger onClick={() => remove(name)} />
                </Space>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add({ id: createId("matcher"), matchScope: "hostname" })}
              >
                添加规则
              </Button>
            </Space>
          )}
        </Form.List>
        <Divider />

        <Title level={5}>详情页检查</Title>
        <Text type="secondary">进一步判断是否位于影片详情页, 可以进行 ID 提取</Text>
        <Form.List name="detailPageGuards">
          {(fields, { add, remove }) => (
            <Space direction="vertical" style={{ width: "100%" }}>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} align="baseline" wrap style={{ width: "100%" }}>
                  <Form.Item {...restField} name={[name, "id"]} label="ID" rules={[{ required: true }]}>
                    <Input style={{ width: 120 }} />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "type"]} label="类型" rules={[{ required: true }]}>
                    <Select
                      style={{ width: 150 }}
                      options={Array.from(guardTypeLabelMap, ([value, label]) => ({ value, label }))}
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "rule"]}
                    label="规则"
                    rules={[{ required: true }]}
                    extra="CSS 选择器/正则表达式/文本片段"
                  >
                    <Input style={{ width: 260 }} />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "priority"]} label="优先级">
                    <InputNumber style={{ width: 120 }} />
                  </Form.Item>
                  <Button icon={<MinusCircleOutlined />} danger onClick={() => remove(name)} />
                </Space>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add({ id: createId("guard"), type: "selector" })}
              >
                添加规则
              </Button>
            </Space>
          )}
        </Form.List>
        <Divider />

        <Title level={5}>ID 提取规则</Title>
        <Form.List name="identifierExtractors">
          {(fields, { add, remove }) => (
            <Space direction="vertical" style={{ width: "100%" }}>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} style={{ border: "1px solid #f0f0f0", padding: 12, borderRadius: 8 }}>
                  <Space align="baseline" wrap>
                    <Form.Item {...restField} name={[name, "id"]} label="ID" rules={[{ required: true }]}>
                      <Input style={{ width: 140 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, "method"]} label="方式" rules={[{ required: true }]}>
                      <Select
                        style={{ width: 170 }}
                        options={Array.from(extractorMethodLabelMap, ([value, label]) => ({ value, label }))}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "identifierType"]}
                      label="ID 类型"
                      rules={[{ required: true }]}
                    >
                      <Input style={{ width: 180 }} placeholder="例如 fanhao" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, "priority"]} label="优先级">
                      <InputNumber style={{ width: 130 }} />
                    </Form.Item>
                    <Button icon={<MinusCircleOutlined />} danger onClick={() => remove(name)} />
                  </Space>
                  <Form.Item
                    {...restField}
                    name={[name, "pattern"]}
                    label="正则表达式"
                    extra="URL 正则方法必填, 其他方法选填, 将用于后处理"
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "replaceWith"]}
                    label="替换模板"
                    extra="当正则存在时生效, 支持捕获组"
                  >
                    <Input placeholder="https://foo.com/$1" />
                  </Form.Item>
                  <Space wrap>
                    <Form.Item {...restField} name={[name, "selector"]} label="选择器" extra="CSS 选择器或 XPath">
                      <Input style={{ width: 260 }} placeholder="CSS Selector/XPath" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "attribute"]}
                      label="属性名"
                      extra="仅对 CSS 选择器有效. 若指定则提取目标元素的属性值"
                    >
                      <Input style={{ width: 160 }} />
                    </Form.Item>
                  </Space>
                </div>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add({ id: createId("extractor"), method: "selector" })}
              >
                添加规则
              </Button>
            </Space>
          )}
        </Form.List>
        <Divider />

        <Title level={5}>UI Placement</Title>
        <Space wrap style={{ width: "100%" }}>
          <Form.Item
            label="挂载点 CSS 选择器"
            name={["uiPlacement", "anchor"]}
            rules={[{ required: true, message: "请输入挂载点" }]}
            initialValue="body"
            extra="指定作为组件挂载点的 DOM 元素"
          >
            <Input style={{ width: 220 }} placeholder="body 或其他选择器" />
          </Form.Item>
          <Form.Item
            label="插入位置"
            name={["uiPlacement", "position"]}
            initialValue="append"
            extra="组件插入挂载点的方式"
          >
            <Select
              style={{ width: 180 }}
              options={Array.from(uiPositionLabelMap, ([value, label]) => ({ value, label }))}
            />
          </Form.Item>
        </Space>
      </Form>
    </Drawer>
  );
};

export default RuleEditorDrawer;
