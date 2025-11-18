import {
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  MenuOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { App, Button, Card, Input, Modal, Space, Spin, Switch, Tag, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import { createDefaultSiteRules } from "@/rules/defaultRules";
import type { SiteRuleStore } from "@/rules/store";
import type { SiteRule } from "@/rules/types";
import RuleEditorDrawer from "./RuleEditorDrawer";

const { Text } = Typography;
const { TextArea } = Input;

const cloneRules = (rules: SiteRule[]): SiteRule[] => JSON.parse(JSON.stringify(rules));

export type OptionsAppProps = {
  store: SiteRuleStore;
  onClose: () => void;
  onRulesUpdated?: (rules: SiteRule[]) => void;
  overlayContainer?: HTMLElement | null;
};

const panelStyle: React.CSSProperties = {
  width: "min(960px, 92vw)",
  maxHeight: "90vh",
  overflow: "hidden",
  background: "#fff",
  borderRadius: "12px",
  boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
  display: "flex",
  flexDirection: "column",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 24px 0 24px",
};

const bodyStyle: React.CSSProperties = {
  padding: "16px 24px 24px 24px",
  overflowY: "auto",
};

const listContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  listStyle: "none",
  margin: 0,
  padding: 0,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: "12px 8px",
  borderBottom: "1px solid #f0f0f0",
  userSelect: "none",
};

const dragHandleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  color: "#888",
  flexShrink: 0,
  borderRadius: 6,
};

const emptyStyle: React.CSSProperties = {
  padding: "40px 0",
  textAlign: "center",
  color: "#999",
};

type DropIndicator = {
  targetId: string | null;
  position: "before" | "after";
};

const reorderRulesList = (
  rules: SiteRule[],
  sourceId: string,
  targetId: string | null,
  position: "before" | "after",
) => {
  const next = cloneRules(rules);
  const fromIndex = next.findIndex((rule) => rule.id === sourceId);
  if (fromIndex < 0) return next;
  const [moved] = next.splice(fromIndex, 1);
  let insertIndex = next.length;
  if (targetId) {
    const targetIndex = next.findIndex((rule) => rule.id === targetId);
    insertIndex = targetIndex < 0 ? next.length : targetIndex + (position === "after" ? 1 : 0);
  }
  next.splice(insertIndex, 0, moved);
  return next;
};

const OptionsApp = ({ store, onClose, onRulesUpdated, overlayContainer }: OptionsAppProps) => {
  const { message, modal } = App.useApp();
  const getOverlayContainer = useCallback(() => overlayContainer ?? document.body, [overlayContainer]);

  const [rules, setRules] = useState<SiteRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [importVisible, setImportVisible] = useState(false);
  const [importText, setImportText] = useState("[]");
  const [exportVisible, setExportVisible] = useState(false);
  const [exportText, setExportText] = useState("[]");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SiteRule | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);

  const loadRules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await store.load();
      setRules(cloneRules(data));
    } catch (error) {
      console.error(error);
      message.error("加载规则失败");
    } finally {
      setLoading(false);
    }
  }, [message, store]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const persistRules = async (nextRules: SiteRule[]) => {
    setSaving(true);
    try {
      await store.save(nextRules);
      setRules(cloneRules(nextRules));
      onRulesUpdated?.(nextRules);
      message.success("规则已保存");
    } catch (error) {
      message.error((error as Error).message || "保存失败");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (siteId: string, enabled: boolean) => {
    const nextRules = rules.map((rule) => (rule.id === siteId ? { ...rule, enabled } : rule));
    await persistRules(nextRules);
  };

  const handleExport = async () => {
    const data = await store.load();
    setExportText(JSON.stringify(data, null, 2));
    setExportVisible(true);
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importText) as SiteRule[];
      await persistRules(parsed);
      setImportVisible(false);
    } catch (error) {
      console.error(error);
      message.error("JSON 解析失败");
    }
  };

  const handleReset = () => {
    modal.confirm({
      title: "恢复默认规则",
      content: "此操作会覆盖当前所有规则，确认继续？",
      okType: "danger",
      zIndex: 100020,
      onOk: async () => {
        const defaults = createDefaultSiteRules();
        await persistRules(defaults);
      },
    });
  };

  const openEditor = (targetRule: SiteRule | null) => {
    setEditingRule(targetRule ? cloneRules([targetRule])[0] : null);
    setEditorOpen(true);
  };

  const handleEditRule = (siteRule: SiteRule) => {
    openEditor(siteRule);
  };

  const handleCreateRule = () => {
    openEditor(null);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingRule(null);
  };

  const handleDeleteRule = (siteRule: SiteRule) => {
    modal.confirm({
      title: "删除站点规则",
      content: `确定删除 ${siteRule.name} (ID: ${siteRule.id})？此操作不可撤销。`,
      okType: "danger",
      okText: "删除",
      cancelText: "取消",
      zIndex: 100020,
      onOk: async () => {
        const nextRules = rules.filter((rule) => rule.id !== siteRule.id);
        await persistRules(nextRules);
      },
    });
  };

  const handleSubmitRule = async (nextRule: SiteRule) => {
    const snapshot = cloneRules(rules);
    const editingIndex = editingRule ? snapshot.findIndex((rule) => rule.id === editingRule.id) : -1;
    const nextIndex = snapshot.findIndex((rule) => rule.id === nextRule.id);

    if (editingIndex >= 0) {
      snapshot.splice(editingIndex, 1, nextRule);
    } else if (nextIndex >= 0) {
      snapshot.splice(nextIndex, 1, nextRule);
    } else {
      snapshot.push(nextRule);
    }

    await persistRules(snapshot);
  };

  const handleCopy = () => {
    message.success("已复制到剪贴板");
    return navigator.clipboard?.writeText(exportText);
  };

  const resetDragState = () => {
    setDraggingId(null);
    setDropIndicator(null);
  };

  const applyReorder = async (sourceId: string, targetId: string | null, position: "before" | "after") => {
    const nextRules = reorderRulesList(rules, sourceId, targetId, position);
    const unchanged = nextRules.every((rule, index) => rule.id === rules[index]?.id);
    if (unchanged) {
      resetDragState();
      return;
    }
    setRules(nextRules);
    try {
      await persistRules(nextRules);
    } catch {
      await loadRules();
    } finally {
      resetDragState();
    }
  };

  const handleRowDragOver = (event: React.DragEvent<HTMLElement>, targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const position: "before" | "after" = event.clientY - bounds.top < bounds.height / 2 ? "before" : "after";
    setDropIndicator({ targetId, position });
  };

  const handleRowDrop = async (event: React.DragEvent<HTMLElement>, targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    event.preventDefault();
    const position = dropIndicator?.targetId === targetId ? dropIndicator.position : "before";
    await applyReorder(draggingId, targetId, position);
  };

  const handleRowDragLeave = (event: React.DragEvent<HTMLElement>, targetId: string) => {
    if (!dropIndicator || dropIndicator.targetId !== targetId) return;
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && event.currentTarget.contains(nextTarget)) return;
    setDropIndicator(null);
  };

  const handleEndDropZone = async (event: React.DragEvent<HTMLElement>) => {
    if (!draggingId) return;
    event.preventDefault();
    await applyReorder(draggingId, null, "after");
  };
  return (
    <div style={{ ...panelStyle }}>
      <div style={headerStyle}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Jav Nav 配置
          </Typography.Title>
          <Text type="secondary">查看、导入或重置站点规则</Text>
        </div>
        <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
      </div>
      <div style={bodyStyle}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Button icon={<ReloadOutlined />} onClick={loadRules} loading={loading}>
            刷新
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setImportVisible(true)}>
            导入 JSON
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出 JSON
          </Button>
          <Button danger onClick={handleReset} loading={saving}>
            恢复默认
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateRule}>
            新建规则
          </Button>
        </Space>
        <Card bodyStyle={{ padding: 0 }} bordered={false}>
          <Spin spinning={loading} tip="加载中">
            <ul style={listContainerStyle}>
              {!rules.length && !loading ? (
                <div style={emptyStyle}>暂无规则</div>
              ) : (
                rules.map((rule) => {
                  const isDragging = draggingId === rule.id;
                  const indicator = dropIndicator?.targetId === rule.id ? dropIndicator.position : null;
                  return (
                    <li
                      key={rule.id}
                      onDragOver={(event) => handleRowDragOver(event, rule.id)}
                      onDrop={(event) => void handleRowDrop(event, rule.id)}
                      onDragLeave={(event) => handleRowDragLeave(event, rule.id)}
                      style={{
                        ...rowStyle,
                        opacity: isDragging ? 0.6 : 1,
                        borderTop: indicator === "before" ? "2px solid #1677ff" : rowStyle.borderBottom,
                        borderBottom:
                          indicator === "after"
                            ? "2px solid #1677ff"
                            : draggingId && !indicator
                              ? "1px solid #f0f0f0"
                              : rowStyle.borderBottom,
                        background: isDragging ? "rgba(22,119,255,0.08)" : "transparent",
                      }}
                    >
                      <button
                        type="button"
                        draggable
                        onDragStart={(event) => {
                          setDraggingId(rule.id);
                          event.dataTransfer?.setData("text/plain", rule.id);
                        }}
                        onDragEnd={resetDragState}
                        aria-label={`拖拽 ${rule.name}`}
                        style={{
                          ...dragHandleStyle,
                          cursor: "grab",
                          background: isDragging ? "rgba(22,119,255,0.15)" : "transparent",
                          border: "none",
                          padding: 0,
                          outline: "none",
                        }}
                      >
                        <MenuOutlined />
                      </button>
                      <div style={{ flex: 1 }}>
                        <Space direction="vertical" size={0}>
                          <Text strong>{rule.name}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            ID: {rule.id}
                          </Text>
                        </Space>
                        <Space size={[4, 4]} wrap style={{ marginTop: 8 }}>
                          {rule.keywords.map((keyword) => (
                            <Tag key={keyword} color="blue">
                              {keyword}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                      <Space size={16} align="center">
                        <Button type="link" icon={<EditOutlined />} onClick={() => handleEditRule(rule)}>
                          编辑
                        </Button>
                        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteRule(rule)}>
                          删除
                        </Button>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Text type="secondary">启用</Text>
                          <Switch
                            checked={rule.enabled !== false}
                            onChange={(checked) => handleToggle(rule.id, checked)}
                            loading={saving}
                          />
                        </div>
                      </Space>
                    </li>
                  );
                })
              )}
              {rules.length ? (
                <li
                  onDragOver={(event) => {
                    if (!draggingId) return;
                    event.preventDefault();
                    setDropIndicator({ targetId: null, position: "after" });
                  }}
                  onDrop={(event) => void handleEndDropZone(event)}
                  style={{
                    height: 24,
                    border: dropIndicator?.targetId === null ? "2px dashed #1677ff" : "2px dashed transparent",
                    margin: "8px 8px 16px",
                    borderRadius: 4,
                  }}
                />
              ) : null}
            </ul>
          </Spin>
        </Card>
      </div>
      <Modal
        title="导入规则 JSON"
        open={importVisible}
        onOk={handleImport}
        onCancel={() => setImportVisible(false)}
        okText="导入"
        cancelText="取消"
        confirmLoading={saving}
        zIndex={100020}
        getContainer={getOverlayContainer}
      >
        <TextArea
          rows={8}
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          placeholder="粘贴规则 JSON"
        />
      </Modal>
      <Modal
        title="导出规则 JSON"
        open={exportVisible}
        footer={null}
        onCancel={() => setExportVisible(false)}
        zIndex={100020}
        getContainer={getOverlayContainer}
      >
        <TextArea rows={8} value={exportText} readOnly />
        <Space style={{ marginTop: 12, width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={handleCopy}>复制到剪贴板</Button>
          <Button type="primary" onClick={() => setExportVisible(false)}>
            关闭
          </Button>
        </Space>
      </Modal>
      <RuleEditorDrawer
        open={editorOpen}
        rule={editingRule}
        onSubmit={handleSubmitRule}
        onClose={closeEditor}
        portalContainer={overlayContainer}
      />
    </div>
  );
};

export default OptionsApp;
