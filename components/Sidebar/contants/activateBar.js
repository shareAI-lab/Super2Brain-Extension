import {
  Settings,
  Scissors,
  Star,
  ScanSearch,
  MessageSquareText,
  Sparkle,
  List,
} from "lucide-react";
import { DeepSearchSvg } from "./deepSearchSvg";

export const ACTIVATE_ITEMS = [
  { id: 1, icon: MessageSquareText, tooltip: "网页问答" },
  { id: 2, icon: ScanSearch, tooltip: "搜索问答" },
  { id: 3, icon: DeepSearchSvg, tooltip: "Deep Search" },
  { id: 0, icon: Sparkle, tooltip: "网页速览" },
  { id: 4, icon: List, tooltip: "任务队列" },
  { id: 5, icon: Settings, tooltip: "设置" },
];

export const createTags = ({ currentModelSupportsImage }) => [
  {
    text: "网页截图",
    icon: Scissors,
    type: "screenshot",
    disabled: !currentModelSupportsImage,
  },
];
