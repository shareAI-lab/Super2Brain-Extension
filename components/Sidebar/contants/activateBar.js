import {
  Settings,
  Scissors,
  Star,
  ScanSearch,
  MessageSquareText,
  Sparkle,
  List,
  ScanEye,
  Bot,
  FileSearch,
  LayoutList,
} from "lucide-react";
import { DeepSearchSvg } from "./deepSearchSvg";

export const ACTIVATE_ITEMS = [
  { id: 0, icon: ScanEye, tooltip: "网页速览" },
  { id: 1, icon: Bot, tooltip: "网页问答" },
  { id: 2, icon: FileSearch, tooltip: "搜索问答" },
  { id: 3, icon: Sparkle, tooltip: "深度思考搜索" },
  { id: 4, icon: LayoutList, tooltip: "任务队列" },
  { id: 5, icon: Settings, tooltip: "设置" },
];

export const createTags = ({ currentModelSupportsImage }) => [
  {
    text: currentModelSupportsImage
      ? "网页截图"
      : "当前模型不支持截图，请切换其他模型",
    icon: Scissors,
    type: "screenshot",
    disabled: !currentModelSupportsImage,
  },
];
