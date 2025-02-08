import {
  MessageSquare,
  Globe,
  FileText,
  MessageSquareShare,
  Settings,
  Scissors,
  FileDigit,
  Star,
} from "lucide-react";

export const ACTIVATE_ITEMS = [
  { id: 0, icon: MessageSquare, tooltip: "网页速览" },
  { id: 1, icon: Globe, tooltip: "网页问答" },
  { id: 2, icon: FileText, tooltip: "联网搜索" },
  { id: 3, icon: MessageSquareShare, tooltip: "知识库搜索" },
  { id: 4, icon: Settings, tooltip: "设置" },
];

export const createTags = ({ currentModelSupportsImage }) => [
  {
    text: "网页截图",
    icon: Scissors,
    type: "screenshot",
    disabled: !currentModelSupportsImage,
  },
  {
    text: "收藏网页到知识库",
    icon: Star,
    type: "bookmark",
    disabled: false,
  },
];
