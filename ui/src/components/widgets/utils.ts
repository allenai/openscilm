export async function isCorpusIdShowable(
  corpusId: string | number,
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://mage.allen.ai/isShowable/${corpusId}`,
    );
    if (response.status === 200) {
      const data = await response.json();
      return Boolean(data.showable);
    } else {
      console.error('Error fetching showable url', corpusId);
      return false;
    }
  } catch (error) {
    console.error('Error fetching showable url', corpusId, error);
    return false;
  }
}


export interface Evidence {
  heading?: string;
  text: string;
}
