# перенос принятой разметки (шаблон) на другую запись: DTW по хроме микса с перебором транспозиций
import sys, json, numpy as np, soundfile as sf
SR=16000; HOP=1600; NFFT=4096          # кадр 0.1 с
def chroma(path):
    x,sr=sf.read(path,dtype='float32'); assert sr==SR
    if x.ndim>1: x=x.mean(1)
    n=1+(len(x)-NFFT)//HOP
    w=np.hanning(NFFT).astype('float32')
    S=np.abs(np.fft.rfft(np.lib.stride_tricks.as_strided(x,(n,NFFT),(HOP*4,4))*w,axis=1))
    S=np.log1p(100*S)
    f=np.fft.rfftfreq(NFFT,1/SR); sel=(f>=60)&(f<=2500)
    pc=(np.round(12*np.log2(f[sel]/440.0))+69).astype(int)%12
    C=np.zeros((n,12),dtype='float32')
    for k in range(12): C[:,k]=S[:,sel][:,pc==k].sum(1)
    C/=np.linalg.norm(C,axis=1,keepdims=True)+1e-6
    return C
def dtw_free(T,X):
    """DTW с ограничением наклона (шаги 1:1, 2:1, 1:2 — темп в пределах x0.5..x2); шаблон T целиком,
    у цели X свободные начало и конец. Векторизовано по строкам."""
    N,M=len(T),len(X); INF=np.inf
    c=(1.0-T@X.T).astype('float32')
    D=np.full((N+2,M+2),INF,dtype='float32'); S=np.zeros((N+2,M+2),dtype=np.int8)
    D[2,2:]=c[0]
    for i in range(1,N):
        ii=i+2
        d11=D[ii-1,1:M+1]+c[i]
        d21=D[ii-2,1:M+1]+c[i-1]+c[i]
        d12=D[ii-1,0:M]+np.concatenate([[INF],c[i,:-1]]).astype('float32')+c[i]
        st=np.vstack([d11,d21,d12]); k=st.argmin(0)
        D[ii,2:]=st[k,np.arange(M)]; S[ii,2:]=k+1
    j=int(np.argmin(D[N+1,2:])); i=N-1; path=[(i,j)]
    while i>0 and j>0:
        s=S[i+2,j+2]
        if s==1: i-=1; j-=1
        elif s==2: i-=2; j-=1
        else: i-=1; j-=2
        path.append((max(i,0),max(j,0)))
    return float(D[N+1,2:].min()/N), path[::-1]
if __name__=="__main__":
    tmpl_wav, tgt_wav, out = sys.argv[1:4]
    T=chroma(tmpl_wav); X=chroma(tgt_wav)
    best=None
    for sh in range(12):
        c,p=dtw_free(T,np.roll(X,sh,axis=1))
        if best is None or c<best[0]: best=(c,sh,p)
        print(f"  транспозиция {sh:2d}: стоимость {c:.4f}",flush=True)
    c,sh,path=best
    # отображение времени шаблона -> цели (среднее j по каждому i)
    mp={}
    for i,j in path: mp.setdefault(i,[]).append(j)
    ti=np.array(sorted(mp)); tj=np.array([np.mean(mp[i]) for i in ti])
    json.dump({"shift":sh,"cost":c,"tmpl_t":(ti*HOP/SR).tolist(),"tgt_t":(tj*HOP/SR).tolist(),
               "tmpl_dur":len(T)*HOP/SR,"tgt_dur":len(X)*HOP/SR},open(out,'w'))
    print(f"выбрана транспозиция {sh} полутонов, стоимость {c:.4f}; шаблон {len(T)*HOP/SR:.0f} с -> цель {len(X)*HOP/SR:.0f} с; путь покрывает цель {tj[0]*HOP/SR:.1f}–{tj[-1]*HOP/SR:.1f} с")
