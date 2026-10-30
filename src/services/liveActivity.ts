export const LiveActivity = {
  start: (title: string, targetSeconds?: number) => {
    console.log('TODO: Native bridge LiveActivity.start', { title, targetSeconds });
  },
  update: (secondsRemaining: number) => {
    console.log('TODO: Native bridge LiveActivity.update', { secondsRemaining });
  },
  end: () => {
    console.log('TODO: Native bridge LiveActivity.end');
  },
};
