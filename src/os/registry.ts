/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ComponentType } from "react";
import { Window } from "./primitives/Window";
import { Sidebar } from "./primitives/Sidebar";
import { Toolbar } from "./primitives/Toolbar";
import { Content, Text, Divider } from "./primitives/Content";
import { Button } from "./primitives/Button";
import { Card } from "./primitives/Card";
import { ListRow } from "./primitives/ListRow";
import { TextField } from "./primitives/TextField";
import { Switch } from "./primitives/Switch";
import { SegmentedControl } from "./primitives/SegmentedControl";
import { Badge } from "./primitives/Badge";

// THE REGISTRY — the design system and the renderer are the same object. A
// node's `type` is the key here. Adding a primitive = write it + add one line.
// The renderer never changes. Off-registry types render nothing (the guardrail).
// Keep this in lockstep with the vocabulary in `schema.ts`.
export const REGISTRY: Record<string, ComponentType<any>> = {
  Window,
  Sidebar,
  Toolbar,
  Content,
  Card,
  Text,
  Button,
  ListRow,
  TextField,
  Switch,
  SegmentedControl,
  Badge,
  Divider,
};
