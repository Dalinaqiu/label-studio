import { useCallback, useState } from "react";
import { Button } from "@humansignal/ui";
import { useAPI } from "../../../providers/ApiProvider";
import { Typography } from "@humansignal/ui";

export const StartModelTraining = ({ backend }) => {
  const api = useAPI();
  const [response, setResponse] = useState(null);

  const onStartTraining = useCallback(
    async (backend) => {
      const res = await api.callApi("trainMLBackend", {
        params: {
          pk: backend.id,
        },
      });

      setResponse(res.response || {});
    },
    [api],
  );

  return (
    <div className="max-w-[680px]">
      <Typography size="small" className="text-neutral-content-subtler">
        你将手动触发模型训练流程。该操作会根据 ML 后端的 train 方法实现启动训练阶段，请确认后继续。
      </Typography>
      <Typography size="small" className="text-neutral-content-subtler mt-base mb-wide">
        *注意：当前界面没有内置反馈用于跟踪训练进度，需要在模型自身的工具和环境中查看训练过程。
      </Typography>

      {!response && (
        <Button
          onClick={() => {
            onStartTraining(backend);
          }}
        >
          开始训练
        </Button>
      )}

      {!!response && (
        <>
          <pre>请求已发送！</pre>
          <pre>响应：{JSON.stringify(response, null, 2)}</pre>
        </>
      )}
    </div>
  );
};
