import { inject, observer } from "mobx-react";
import { useEffect, useState } from "react";
import { RadioGroup } from "../../Common/RadioGroup/RadioGroup";

const OPTIONS = [
  { value: "", label: "全部" },
  { value: "my_annotation", label: "我的待标注" },
  { value: "my_review", label: "我的待审核" },
  { value: "my_final_review", label: "我的待终审" },
];

const injector = inject(({ store }) => ({
  store,
  project: store.project,
}));

export const WorkflowScopeToggle = injector(
  observer(({ store, project, size, ...rest }) => {
    if (project?.workflow_enabled !== true) return null;

    const sharedValue = store.SDK.api.sharedParams?.workflow_scope ?? "";
    const [currentValue, setCurrentValue] = useState(sharedValue);

    useEffect(() => {
      setCurrentValue(sharedValue);
    }, [sharedValue]);

    const handleChange = async (event) => {
      const nextValue = event.target.value;
      setCurrentValue(nextValue);

      if (nextValue) {
        store.SDK.api.sharedParams.workflow_scope = nextValue;
      } else {
        delete store.SDK.api.sharedParams.workflow_scope;
      }

      await store.currentView?.reload({ interaction: "workflow_scope" });
    };

    return (
      <RadioGroup size={size} value={currentValue} onChange={handleChange} {...rest}>
        {OPTIONS.map((option) => (
          <RadioGroup.Button
            key={option.value || "all"}
            value={option.value}
            aria-label={option.label}
            data-testid={`workflow-scope-${option.value || "all"}`}
          >
            {option.label}
          </RadioGroup.Button>
        ))}
      </RadioGroup>
    );
  }),
);
