import torch
import torch.nn.functional as F

from cross_entropy_model_fbank import FBankCrossEntropyNet


def get_cosine_distance(a, b):
    a = torch.from_numpy(a)
    b = torch.from_numpy(b)
    return (1 - F.cosine_similarity(a, b)).numpy()


# MODEL_PATH = 'weights/3.pth'
# model_instance = FBankCrossEntropyNet()
# print("executed instance")
# model_instance.load_state_dict(torch.load(MODEL_PATH, map_location=lambda storage, loc: storage))
# model_instance = model_instance.double()
# model_instance.eval()


def get_embeddings(x):
    MODEL_PATH = 'weights/3.pth'
    model_instance = FBankCrossEntropyNet()
    model_instance.load_state_dict(torch.load(MODEL_PATH, map_location=lambda storage, loc: storage))
    model_instance = model_instance.double()
    model_instance.eval()

    x = torch.from_numpy(x)
    with torch.no_grad():
        embeddings = model_instance(x)
    return embeddings.numpy()
