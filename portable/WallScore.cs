using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Printing;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Text;
using System.Windows.Forms;

namespace WallScorePortable {
    internal static class Start {
        [STAThread] static void Main() {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new Planner());
        }
    }

    public sealed class Mount {
        public decimal Width, Height, Inset, X, Y;
        public string Letter;
    }

    public sealed class Planner : Form {
        private static readonly Color Ink = Color.FromArgb(30,52,43);
        private static readonly Color Paper = Color.FromArgb(248,248,241);
        private readonly NumericUpDown[] wallInputs = new NumericUpDown[3];
        private readonly NumericUpDown[,] frameInputs = new NumericUpDown[3,3];
        private readonly Label results = new Label();
        private readonly Button print = new Button();
        private readonly CheckBox hooks = new CheckBox();
        private readonly WallView diagram = new WallView();
        private Mount[] plan;
        private bool ready;
        private decimal wall, center, gap;

        private static Label Caption(string s) {
            return new Label { Text=s, AutoSize=false, Dock=DockStyle.Fill,
                TextAlign=ContentAlignment.MiddleLeft, ForeColor=Ink };
        }
        private NumericUpDown Number(string id, decimal min, decimal value) {
            var input = new NumericUpDown { Name=id, Minimum=min, Maximum=10000, DecimalPlaces=1,
                Increment=0.5m, Value=value, Dock=DockStyle.Fill, TextAlign=HorizontalAlignment.Right,
                ThousandsSeparator=false, Margin=new Padding(4,4,4,3), AccessibleName=id };
            input.ValueChanged += delegate { UpdatePlan(); };
            return input;
        }

        public Planner() {
            Text="WallScore · Planificador de cuadros";
            StartPosition=FormStartPosition.CenterScreen;
            ClientSize=new Size(1020,650);
            MinimumSize=new Size(820,590);
            Font=new Font("Segoe UI",10);
            AutoScaleMode=AutoScaleMode.Font;
            BackColor=Paper;
            var page=new TableLayoutPanel { Dock=DockStyle.Fill, Padding=new Padding(24), ColumnCount=1, RowCount=3 };
            page.RowStyles.Add(new RowStyle(SizeType.Absolute,73));
            page.RowStyles.Add(new RowStyle(SizeType.Percent,100));
            page.RowStyles.Add(new RowStyle(SizeType.Absolute,60));
            Controls.Add(page);
            var title=Caption("WallScore"); title.Font=new Font("Georgia",30); page.Controls.Add(title,0,0);

            var body=new TableLayoutPanel { Dock=DockStyle.Fill, ColumnCount=2, RowCount=1 };
            body.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute,330));
            body.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,100));
            page.Controls.Add(body,0,1);
            var form=new TableLayoutPanel { Dock=DockStyle.Fill, ColumnCount=1, Padding=new Padding(0,0,12,0) };
            form.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,100));
            foreach (int height in new int[]{38,110,38,137,58}) form.RowStyles.Add(new RowStyle(SizeType.Absolute,height));
            body.Controls.Add(form,0,0);
            AddHeading(form,"Pared · cm");
            var dims=new TableLayoutPanel { Dock=DockStyle.Fill, ColumnCount=2 };
            dims.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,65));
            dims.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,35));
            string[] names={"Ancho disponible","Altura común del centro","Separación entre marcos"};
            decimal[] defaults={240,150,8};
            for(int i=0;i<3;i++) {
                dims.RowStyles.Add(new RowStyle(SizeType.Absolute,35));
                dims.Controls.Add(Caption(names[i]),0,i);
                wallInputs[i]=Number(names[i],i==2?0:0.1m,defaults[i]);
                dims.Controls.Add(wallInputs[i],1,i);
            }
            form.Controls.Add(dims);
            AddHeading(form,"Marcos · cm");
            var grid=new TableLayoutPanel { Dock=DockStyle.Fill, ColumnCount=4};
            grid.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute,30));
            for(int i=0;i<3;i++) grid.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,33.33f));
            string[] headings={"","Ancho","Alto","Anclaje"};
            for(int j=0;j<4;j++) grid.Controls.Add(Caption(headings[j]),j,0);
            grid.RowStyles.Add(new RowStyle(SizeType.Absolute,25));
            decimal[,] sizes={{30,40,4},{40,30,3},{24,36,5}};
            for(int i=0;i<3;i++) {
                string letter=((char)('A'+i)).ToString();
                grid.RowStyles.Add(new RowStyle(SizeType.Absolute,35));
                grid.Controls.Add(Caption(letter),0,i+1);
                for(int j=0;j<3;j++) {
                    frameInputs[i,j]=Number(letter+" "+headings[j+1],j==2?0:0.1m,sizes[i,j]);
                    grid.Controls.Add(frameInputs[i,j],j+1,i+1);
                }
            }
            form.Controls.Add(grid);
            var hint=Caption("Anclaje: distancia del borde superior al punto de apoyo central de cada cuadro.");
            hint.Height=50; hint.Dock=DockStyle.Top; form.Controls.Add(hint);

            var right=new TableLayoutPanel { Dock=DockStyle.Fill, ColumnCount=1, RowCount=3 };
            right.RowStyles.Add(new RowStyle(SizeType.Absolute,38));
            right.RowStyles.Add(new RowStyle(SizeType.Percent,100));
            right.RowStyles.Add(new RowStyle(SizeType.Absolute,106));
            body.Controls.Add(right,1,0);
            hooks.Text="Ver puntos de montaje"; hooks.Checked=true; hooks.AutoSize=true;
            hooks.Name="Ver puntos de montaje"; hooks.CheckedChanged+=delegate {diagram.ShowHooks=hooks.Checked; diagram.Invalidate();};
            right.Controls.Add(hooks,0,0);
            diagram.Dock=DockStyle.Fill; diagram.ShowHooks=true; right.Controls.Add(diagram,0,1);
            results.Name="Marcas"; results.Dock=DockStyle.Fill; results.Padding=new Padding(4,6,0,0);
            right.Controls.Add(results,0,2);
            print.Name="Imprimir"; print.Text="Imprimir plano…"; print.AutoSize=true; print.Anchor=AnchorStyles.Right;
            print.BackColor=Ink; print.ForeColor=Color.White; print.FlatStyle=FlatStyle.Flat; print.Padding=new Padding(10,4,10,4);
            print.Click+=delegate { PrintPlan(); };
            var actions=new FlowLayoutPanel { FlowDirection=FlowDirection.RightToLeft, Dock=DockStyle.Fill, WrapContents=false };
            actions.Controls.Add(print);
            var export=new Button { Name="Exportar", Text="Exportar plano interactivo…", AutoSize=true, Padding=new Padding(10,4,10,4) };
            export.Click+=delegate { ExportInteractive(); };
            actions.Controls.Add(export);
            page.Controls.Add(actions,0,2);
            ready=true; UpdatePlan();
        }

        private static string JsonNumber(decimal n) { return n.ToString(CultureInfo.InvariantCulture); }

        internal string InteractiveHtml() {
            string[] frames=new string[3];
            for(int i=0;i<3;i++) {
                frames[i]="{\"width\":"+JsonNumber(frameInputs[i,0].Value)+",\"height\":"+JsonNumber(frameInputs[i,1].Value)
                    +",\"inset\":"+JsonNumber(frameInputs[i,2].Value)+"}";
            }
            string json="{\"version\":1,\"wall\":"+JsonNumber(wallInputs[0].Value)+",\"center\":"+JsonNumber(wallInputs[1].Value)
                +",\"gap\":"+JsonNumber(wallInputs[2].Value)+",\"frames\":["+String.Join(",",frames)+"]}";
            using(var stream=Assembly.GetExecutingAssembly().GetManifestResourceStream("WallScore.html"))
            using(var reader=new StreamReader(stream,Encoding.UTF8)) {
                return reader.ReadToEnd().Replace("</body>", "<script>loadPlan("+json+");</script></body>");
            }
        }
        private void ExportInteractive() {
            if(plan==null) {
                MessageBox.Show(this,results.Text,"Medidas del plano");
                return;
            }
            using(var dialog=new SaveFileDialog { Filter="Plano interactivo (*.html)|*.html", FileName="Mi plano WallScore.html" }) {
                if(dialog.ShowDialog(this)!=DialogResult.OK) return;
                try { File.WriteAllText(dialog.FileName,InteractiveHtml(),new UTF8Encoding(false)); }
                catch(IOException e) { MessageBox.Show(this,e.Message,"Guardar plano"); }
                catch(UnauthorizedAccessException e) { MessageBox.Show(this,e.Message,"Guardar plano"); }
            }
        }
        private static void AddHeading(TableLayoutPanel parent,string text) {
            var h=Caption(text); h.Font=new Font("Segoe UI",13,FontStyle.Bold);
            h.Height=38; h.Dock=DockStyle.Top; parent.Controls.Add(h);
        }
        private static string Cm(decimal n) { return n.ToString("0.###",CultureInfo.GetCultureInfo("es-ES")); }
        private void UpdatePlan() {
            if(!ready) return;
            wall=wallInputs[0].Value; center=wallInputs[1].Value; gap=wallInputs[2].Value;
            decimal span=2*gap;
            var next=new Mount[3];
            string error=null;
            for(int i=0;i<3;i++) {
                var m=new Mount {Letter=((char)('A'+i)).ToString(),Width=frameInputs[i,0].Value,
                    Height=frameInputs[i,1].Value,Inset=frameInputs[i,2].Value};
                next[i]=m; span+=m.Width;
                if(m.Inset>m.Height) error="El anclaje de "+m.Letter+" queda fuera del marco.";
                if(m.Height/2>center) error="El cuadro "+m.Letter+" quedaría por debajo del suelo.";
            }
            if(span>wall) error="El conjunto mide "+Cm(span)+" cm. Reduce la separación o amplía la pared.";
            if(error==null) {
                decimal left=(wall-span)/2;
                foreach(Mount m in next) {
                    m.X=left+m.Width/2; m.Y=center+m.Height/2-m.Inset; left+=m.Width+gap;
                }
            }
            plan=error==null?next:null;
            results.ForeColor=error==null?Ink:Color.Maroon;
            results.Text=error??("Puntos de apoyo · desde la izquierda y sobre el suelo\r\n"+MarkList(plan));
            print.Enabled=plan!=null;
            diagram.Frames=plan; diagram.Wall=wall; diagram.Center=center; diagram.Invalidate();
        }
        private static string MarkList(Mount[] mounts) {
            var lines=Array.ConvertAll(mounts,m=>m.Letter+"     "+Cm(m.X)+" cm desde la izquierda     ·     "+Cm(m.Y)+" cm de altura");
            return string.Join("\r\n",lines);
        }

        private void PrintPlan() {
            if(plan==null) return;
            using(var doc=new PrintDocument())
            using(var dlg=new PrintDialog()) {
                doc.DocumentName="WallScore - plano de montaje";
                doc.PrintPage+=DrawPrintPage;
                dlg.Document=doc; dlg.UseEXDialog=true;
                try { if(dlg.ShowDialog(this)==DialogResult.OK) doc.Print(); }
                catch(Exception e) { MessageBox.Show(this,e.Message,"Impresión",MessageBoxButtons.OK,MessageBoxIcon.Information); }
            }
        }
        private void DrawPrintPage(object sender,PrintPageEventArgs e) {
            var b=e.MarginBounds;
            float y=b.Top;
            using(var title=new Font("Georgia",24))
            using(var body=new Font("Segoe UI",11)) {
                e.Graphics.DrawString("WallScore · Plano de montaje",title,Brushes.Black,b.X,y); y+=55;
                e.Graphics.DrawString("Pared "+Cm(wall)+" cm   ·   Centro "+Cm(center)+" cm   ·   Separación "+Cm(gap)+" cm",body,Brushes.Black,b.X,y); y+=36;
                int height=Math.Min(240,b.Height/3);
                WallView.DrawWall(e.Graphics,new Rectangle(b.X,(int)y,b.Width,height),plan,wall,center,true); y+=height+22;
                e.Graphics.DrawString(MarkList(plan),body,Brushes.Black,new RectangleF(b.X,y,b.Width,110)); y+=105;
                e.Graphics.DrawString("Mide siempre desde el mismo borde y desde el suelo. La cruz corresponde al apoyo del marco. Comprueba con una cinta métrica el desplazamiento entre apoyo y tornillo antes de perforar.",body,Brushes.Black,new RectangleF(b.X,y,b.Width,160));
            }
            e.HasMorePages=false;
        }
    }

    internal sealed class WallView : Panel {
        public Mount[] Frames;
        public decimal Wall, Center;
        public bool ShowHooks;
        public WallView() { DoubleBuffered=true; BackColor=Color.FromArgb(232,237,225); AccessibleName="Vista frontal de la pared"; }
        protected override void OnPaint(PaintEventArgs e) {
            base.OnPaint(e); DrawWall(e.Graphics,ClientRectangle,Frames,Wall,Center,ShowHooks);
        }
        public static void DrawWall(Graphics g, Rectangle bounds, Mount[] frames, decimal wall, decimal center, bool hooks) {
            if(frames==null || bounds.Width<40 || bounds.Height<60 || wall<=0) return;
            float maxHeight=0;
            foreach(Mount m in frames) maxHeight=Math.Max(maxHeight,(float)m.Height);
            float scale=Math.Min((bounds.Width-30)/(float)wall,(bounds.Height-68)/maxHeight);
            if(scale<=0) return;
            float start=bounds.Left+(bounds.Width-(float)wall*scale)/2, mid=bounds.Top+bounds.Height/2f;
            g.SmoothingMode=SmoothingMode.AntiAlias;
            using(var line=new Pen(Color.FromArgb(122,141,121)))
            using(var border=new Pen(Color.FromArgb(47,77,56),2))
            using(var cross=new Pen(Color.DarkRed,2))
            using(var font=new Font("Segoe UI",10,FontStyle.Bold))
            using(var fmt=new StringFormat { Alignment=StringAlignment.Center }) {
                line.DashStyle=DashStyle.Dash; g.DrawLine(line,start,mid,start+(float)wall*scale,mid);
                foreach(Mount m in frames) {
                    float x=start+(float)m.X*scale, w=(float)m.Width*scale,h=(float)m.Height*scale;
                    var r=new RectangleF(x-w/2,mid-h/2,w,h);
                    g.FillRectangle(Brushes.FloralWhite,r); g.DrawRectangle(border,r.X,r.Y,r.Width,r.Height);
                    g.DrawString(m.Letter,font,Brushes.DarkSlateGray,x,r.Bottom+3,fmt);
                    if(hooks) {
                        float cy=mid-(float)(m.Y-center)*scale;
                        g.DrawLine(cross,x-5,cy,x+5,cy); g.DrawLine(cross,x,cy-5,x,cy+5);
                    }
                }
            }
        }
    }
}
