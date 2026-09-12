"use client";

/**
 * Radio, checkbox and switch wrappers.
 *
 * HeroUI v3 makes these compound components, and the nesting matters. Per
 * @heroui/styles the structure is:
 *
 *   .radio / .checkbox / .switch   → field wrapper, `flex flex-col`
 *     .*__content                  → the clickable ROW (`inline-flex items-center`)
 *       .*__control                → the dot / box / track
 *       label text
 *
 * So the control belongs INSIDE `.Content`. Placing them as siblings (the
 * obvious reading of the API) puts them in the column wrapper instead, and the
 * label renders underneath its own control. Omitting the parts altogether is
 * worse still: the component renders an inert <div> with no input, so the value
 * never reaches FormData.
 *
 * These wrappers encode the correct structure once.
 */
import { Checkbox, Radio, Switch } from "@heroui/react";

export function RadioOption({
  value,
  children,
  className = "",
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Radio value={value} className={className}>
      <Radio.Content>
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        {children}
      </Radio.Content>
    </Radio>
  );
}

export function CheckOption({
  value,
  children,
  className = "",
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Checkbox value={value} className={className}>
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        {children}
      </Checkbox.Content>
    </Checkbox>
  );
}

export function SwitchField({
  name,
  children,
  size = "sm",
  defaultSelected,
  isSelected,
  onChange,
  className = "",
}: {
  name: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  defaultSelected?: boolean;
  /** Pass with `onChange` for a controlled switch; omit for uncontrolled. */
  isSelected?: boolean;
  onChange?: (selected: boolean) => void;
  className?: string;
}) {
  return (
    <Switch
      name={name}
      size={size}
      defaultSelected={defaultSelected}
      isSelected={isSelected}
      onChange={onChange}
      className={className}
    >
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        {children}
      </Switch.Content>
    </Switch>
  );
}
